import Foundation
import CoreMIDI

struct Options {
    var port: Int?
    var uniqueID: Int32?
    var duration: TimeInterval = 10
    var listOnly = false
}

func fail(_ message: String, code: Int32 = 2) -> Never {
    FileHandle.standardError.write(Data(("error: \(message)\n").utf8))
    exit(code)
}

func stringProperty(_ object: MIDIObjectRef, _ property: CFString) -> String? {
    var value: Unmanaged<CFString>?
    guard MIDIObjectGetStringProperty(object, property, &value) == noErr else { return nil }
    return value?.takeRetainedValue() as String?
}

func integerProperty(_ object: MIDIObjectRef, _ property: CFString) -> Int32? {
    var value: Int32 = 0
    guard MIDIObjectGetIntegerProperty(object, property, &value) == noErr else { return nil }
    return value
}

func parseOptions() -> Options {
    var options = Options()
    var args = Array(CommandLine.arguments.dropFirst())
    while !args.isEmpty {
        let arg = args.removeFirst()
        switch arg {
        case "--port":
            guard !args.isEmpty, let value = Int(args.removeFirst()), (1...12).contains(value) else { fail("--port requires 1...12") }
            options.port = value
        case "--unique-id":
            guard !args.isEmpty, let value = Int32(args.removeFirst()) else { fail("--unique-id requires an Int32") }
            options.uniqueID = value
        case "--duration":
            guard !args.isEmpty, let value = Double(args.removeFirst()), value > 0 else { fail("--duration requires seconds > 0") }
            options.duration = value
        case "--list":
            options.listOnly = true
        case "--help", "-h":
            print("usage: mrcc_receive_monitor.swift [--list] [--port 1...12 | --unique-id INT32] [--duration SECONDS]")
            exit(0)
        default:
            fail("unknown argument \(arg)")
        }
    }
    if options.port != nil && options.uniqueID != nil { fail("choose either --port or --unique-id, not both") }
    return options
}

func mrccSources() -> [(endpoint: MIDIEndpointRef, name: String, uniqueID: Int32)] {
    var result: [(MIDIEndpointRef, String, Int32)] = []
    for index in 0..<MIDIGetNumberOfSources() {
        let endpoint = MIDIGetSource(index)
        guard stringProperty(endpoint, kMIDIPropertyManufacturer) == "Conductive Labs",
              stringProperty(endpoint, kMIDIPropertyModel) == "MRCC" else { continue }
        result.append((endpoint, stringProperty(endpoint, kMIDIPropertyName) ?? "", integerProperty(endpoint, kMIDIPropertyUniqueID) ?? 0))
    }
    return result
}

func emit(_ object: [String: Any]) {
    guard let data = try? JSONSerialization.data(withJSONObject: object, options: [.sortedKeys]) else { return }
    FileHandle.standardOutput.write(data)
    FileHandle.standardOutput.write(Data("\n".utf8))
}

func classification(status: UInt8, data1: UInt8?, data2: UInt8?) -> [String: Any] {
    var result: [String: Any] = ["status_hex": String(format: "%02X", status)]
    if status < 0xF0 {
        result["channel"] = Int(status & 0x0F) + 1
        switch status & 0xF0 {
        case 0x80: result["type"] = "note_off"
        case 0x90: result["type"] = (data2 == 0 ? "note_off" : "note_on")
        case 0xA0: result["type"] = "poly_pressure"
        case 0xB0: result["type"] = "control_change"
        case 0xC0: result["type"] = "program_change"
        case 0xD0: result["type"] = "channel_pressure"
        case 0xE0: result["type"] = "pitch_bend"
        default: result["type"] = "channel_voice_unknown"
        }
        if let data1 { result["data1"] = Int(data1) }
        if let data2 { result["data2"] = Int(data2) }
    } else {
        let names: [UInt8: String] = [
            0xF0: "sysex", 0xF1: "mtc_quarter_frame", 0xF2: "song_position", 0xF3: "song_select",
            0xF6: "tune_request", 0xF7: "sysex_end", 0xF8: "clock", 0xFA: "start", 0xFB: "continue",
            0xFC: "stop", 0xFE: "active_sensing", 0xFF: "system_reset"
        ]
        result["type"] = names[status] ?? "system_unknown"
    }
    return result
}

let options = parseOptions()
let sources = mrccSources()
if options.listOnly {
    emit(["observed_at": ISO8601DateFormatter().string(from: Date()), "sources": sources.map { ["name": $0.name, "unique_id": $0.uniqueID] }])
    exit(0)
}

guard !sources.isEmpty else { fail("no Conductive Labs MRCC CoreMIDI sources found", code: 3) }
let selected: (endpoint: MIDIEndpointRef, name: String, uniqueID: Int32)
if let port = options.port {
    guard let match = sources.first(where: { $0.name == "Port \(port)" }) else { fail("MRCC Port \(port) source not found", code: 3) }
    selected = match
} else if let uniqueID = options.uniqueID {
    guard let match = sources.first(where: { $0.uniqueID == uniqueID }) else { fail("MRCC source unique ID \(uniqueID) not found", code: 3) }
    selected = match
} else {
    fail("select an MRCC source with --port or --unique-id")
}

var client = MIDIClientRef()
var inputPort = MIDIPortRef()
var eventCount = 0
let clientStatus = MIDIClientCreateWithBlock("MRCC Receive Monitor" as CFString, &client) { _ in }
guard clientStatus == noErr else { fail("MIDIClientCreateWithBlock failed: \(clientStatus)", code: 4) }
let portStatus = MIDIInputPortCreateWithProtocol(client, "MRCC Receive Input" as CFString, MIDIProtocolID._1_0, &inputPort) { eventList, _ in
    let packetList = eventList.pointee
    var packet = packetList.packet
    for _ in 0..<packetList.numPackets {
        let wordCount = Int(packet.wordCount)
        let words: [UInt32] = withUnsafeBytes(of: packet.words) { raw in
            Array(raw.bindMemory(to: UInt32.self).prefix(wordCount))
        }
        for word in words {
            let messageType = UInt8((word >> 28) & 0x0F)
            if messageType == 0x2 {
                let status = UInt8((word >> 16) & 0xFF)
                let data1 = UInt8((word >> 8) & 0xFF)
                let data2 = UInt8(word & 0xFF)
                var event = classification(status: status, data1: data1, data2: data2)
                event["observed_at"] = ISO8601DateFormatter().string(from: Date())
                event["source_name"] = selected.name
                event["source_unique_id"] = selected.uniqueID
                event["transport"] = "ump_midi1_channel_voice"
                eventCount += 1
                emit(event)
            } else if messageType == 0x1 {
                let status = UInt8((word >> 16) & 0xFF)
                var event = classification(status: status, data1: UInt8((word >> 8) & 0xFF), data2: UInt8(word & 0xFF))
                event["observed_at"] = ISO8601DateFormatter().string(from: Date())
                event["source_name"] = selected.name
                event["source_unique_id"] = selected.uniqueID
                event["transport"] = "ump_system"
                eventCount += 1
                emit(event)
            } else {
                emit(["observed_at": ISO8601DateFormatter().string(from: Date()), "source_name": selected.name, "source_unique_id": selected.uniqueID, "type": "ump_unparsed", "ump_message_type": Int(messageType), "word_count": wordCount])
                eventCount += 1
            }
        }
        packet = MIDIEventPacketNext(&packet).pointee
    }
}
guard portStatus == noErr else { fail("MIDIInputPortCreateWithProtocol failed: \(portStatus)", code: 4) }
let connectStatus = MIDIPortConnectSource(inputPort, selected.endpoint, nil)
guard connectStatus == noErr else { fail("MIDIPortConnectSource failed: \(connectStatus)", code: 4) }

emit(["event": "monitor_started", "observed_at": ISO8601DateFormatter().string(from: Date()), "source_name": selected.name, "source_unique_id": selected.uniqueID, "duration_seconds": options.duration, "read_only": true])
RunLoop.current.run(until: Date().addingTimeInterval(options.duration))
MIDIPortDisconnectSource(inputPort, selected.endpoint)
MIDIPortDispose(inputPort)
MIDIClientDispose(client)
emit(["event": "monitor_stopped", "observed_at": ISO8601DateFormatter().string(from: Date()), "source_name": selected.name, "source_unique_id": selected.uniqueID, "received_event_count": eventCount])

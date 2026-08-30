import CoreMIDI
import Foundation

struct Options {
    let sourceUID: MIDIUniqueID
    let channel: UInt8
}

func fail(_ message: String) -> Never {
    FileHandle.standardError.write(Data((message + "\n").utf8))
    exit(2)
}

func parseOptions() -> Options {
    let args = Array(CommandLine.arguments.dropFirst())
    guard args.count == 4, args[0] == "--source-uid", args[2] == "--channel" else {
        fail("usage: coremidi_receive --source-uid UID --channel 1..16")
    }
    guard let uid = Int32(args[1]), let channel = UInt8(args[3]), (1...16).contains(channel) else {
        fail("invalid source UID or MIDI channel")
    }
    return Options(sourceUID: uid, channel: channel - 1)
}

func sourceUID(_ endpoint: MIDIEndpointRef) -> MIDIUniqueID? {
    var uid: Int32 = 0
    guard MIDIObjectGetIntegerProperty(endpoint, kMIDIPropertyUniqueID, &uid) == noErr else { return nil }
    return uid
}
func emitCC(_ cc: UInt8, _ value: UInt8) {
    let line = "{\"type\":\"cc\",\"cc\":\(cc),\"value\":\(value)}\n"
    FileHandle.standardOutput.write(Data(line.utf8))
}

let options = parseOptions()
var selected: MIDIEndpointRef = 0
for index in 0..<MIDIGetNumberOfSources() {
    let endpoint = MIDIGetSource(index)
    if sourceUID(endpoint) == options.sourceUID {
        selected = endpoint
        break
    }
}
guard selected != 0 else { fail("CoreMIDI source UID not found: \(options.sourceUID)") }

var client = MIDIClientRef()
var port = MIDIPortRef()
guard MIDIClientCreateWithBlock("studio-generative-rx" as CFString, &client, { _ in }) == noErr else {
    fail("could not create CoreMIDI client")
}
guard MIDIInputPortCreateWithProtocol(client, "receive" as CFString, ._1_0, &port, { eventList, _ in
    var packet = eventList.pointee.packet
    for _ in 0..<eventList.pointee.numPackets {
        withUnsafePointer(to: &packet.words) { words in
            words.withMemoryRebound(to: UInt32.self, capacity: Int(packet.wordCount)) { buffer in
                for index in 0..<Int(packet.wordCount) {
                    let word = buffer[index]
                    let status = UInt8((word >> 16) & 0xFF)
                    if status & 0xF0 == 0xB0, status & 0x0F == options.channel {
                        emitCC(UInt8((word >> 8) & 0x7F), UInt8(word & 0x7F))
                    }
                }
            }
        }
        packet = MIDIEventPacketNext(&packet).pointee
    }
}) == noErr else { fail("could not create CoreMIDI input port") }
guard MIDIPortConnectSource(port, selected, nil) == noErr else {
    fail("could not connect CoreMIDI source")
}

FileHandle.standardError.write(Data("listening source_uid=\(options.sourceUID) channel=\(options.channel + 1)\n".utf8))
RunLoop.current.run()

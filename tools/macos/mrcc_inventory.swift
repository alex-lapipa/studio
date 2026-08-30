import Foundation
import CoreMIDI

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

func endpointRecord(kind: String, index: Int, endpoint: MIDIEndpointRef) -> [String: Any] {
    return [
        "kind": kind,
        "index": index,
        "name": stringProperty(endpoint, kMIDIPropertyName) ?? "",
        "display_name": stringProperty(endpoint, kMIDIPropertyDisplayName) ?? "",
        "manufacturer": stringProperty(endpoint, kMIDIPropertyManufacturer) ?? "",
        "model": stringProperty(endpoint, kMIDIPropertyModel) ?? "",
        "unique_id": integerProperty(endpoint, kMIDIPropertyUniqueID) ?? 0,
    ]
}

var records: [[String: Any]] = []
for index in 0..<MIDIGetNumberOfSources() {
    records.append(endpointRecord(kind: "source", index: index, endpoint: MIDIGetSource(index)))
}
for index in 0..<MIDIGetNumberOfDestinations() {
    records.append(endpointRecord(kind: "destination", index: index, endpoint: MIDIGetDestination(index)))
}
let mrcc = records.filter {
    (($0["manufacturer"] as? String) == "Conductive Labs") && (($0["model"] as? String) == "MRCC")
}
let output: [String: Any] = [
    "observed_at": ISO8601DateFormatter().string(from: Date()),
    "source_count": mrcc.filter { ($0["kind"] as? String) == "source" }.count,
    "destination_count": mrcc.filter { ($0["kind"] as? String) == "destination" }.count,
    "endpoints": mrcc,
]
let data = try JSONSerialization.data(withJSONObject: output, options: [.prettyPrinted, .sortedKeys])
FileHandle.standardOutput.write(data)
FileHandle.standardOutput.write(Data("\n".utf8))

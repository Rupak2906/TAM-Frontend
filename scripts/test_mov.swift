import Foundation
import AVFoundation
import CoreGraphics
import AppKit

let out = URL(fileURLWithPath: FileManager.default.currentDirectoryPath).appendingPathComponent("public/media/test.mov")
try? FileManager.default.removeItem(at: out)
let w=640, h=360
let writer = try AVAssetWriter(outputURL: out, fileType: .mov)
let settings:[String:Any] = [AVVideoCodecKey: AVVideoCodecType.proRes422, AVVideoWidthKey:w, AVVideoHeightKey:h]
let input = AVAssetWriterInput(mediaType: .video, outputSettings: settings)
input.expectsMediaDataInRealTime=false
let adaptor = AVAssetWriterInputPixelBufferAdaptor(assetWriterInput: input, sourcePixelBufferAttributes: nil)
writer.add(input)
writer.startWriting(); writer.startSession(atSourceTime: .zero)
for f in 0..<90 {
  while !input.isReadyForMoreMediaData { usleep(1000) }
  var px: CVPixelBuffer?
  let attrs:[CFString:Any] = [kCVPixelBufferCGImageCompatibilityKey:true,kCVPixelBufferCGBitmapContextCompatibilityKey:true]
  CVPixelBufferCreate(kCFAllocatorDefault, w, h, kCVPixelFormatType_32BGRA, attrs as CFDictionary, &px)
  guard let p=px else { continue }
  CVPixelBufferLockBaseAddress(p, [])
  let ctx = CGContext(data: CVPixelBufferGetBaseAddress(p), width: w, height: h, bitsPerComponent: 8, bytesPerRow: CVPixelBufferGetBytesPerRow(p), space: CGColorSpaceCreateDeviceRGB(), bitmapInfo: CGImageAlphaInfo.premultipliedFirst.rawValue)!
  let t = CGFloat(f)/90
  ctx.setFillColor(NSColor(calibratedRed: 0.05, green: 0.1, blue: 0.2, alpha: 1).cgColor)
  ctx.fill(CGRect(x:0,y:0,width:w,height:h))
  ctx.setFillColor(NSColor(calibratedRed: 0.1+t*0.8, green: 0.5, blue: 0.9, alpha: 1).cgColor)
  ctx.fill(CGRect(x:Int(40+200*t),y:120,width:120,height:80))
  CVPixelBufferUnlockBaseAddress(p, [])
  let ok=adaptor.append(p, withPresentationTime: CMTime(value: CMTimeValue(f), timescale: 30))
  if !ok { print("append fail", writer.error?.localizedDescription ?? "?") }
}
input.markAsFinished()
let sem=DispatchSemaphore(value:0)
writer.finishWriting{sem.signal()}
_ = sem.wait(timeout:.now()+20)
print(writer.status == .completed ? "ok" : "fail \(writer.error?.localizedDescription ?? "?")")

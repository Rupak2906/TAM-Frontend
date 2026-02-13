import Foundation
import AVFoundation
import CoreGraphics
import AppKit

let outputPath = "public/media/analyst-workflow.mp4"
let width = 1280
let height = 720
let fps: Int32 = 30
let durationSeconds: Double = 8.0
let totalFrames = Int(durationSeconds * Double(fps))

let outURL = URL(fileURLWithPath: FileManager.default.currentDirectoryPath).appendingPathComponent(outputPath)
try? FileManager.default.removeItem(at: outURL)

let writer = try AVAssetWriter(outputURL: outURL, fileType: .mp4)
let videoSettings: [String: Any] = [
  AVVideoCodecKey: AVVideoCodecType.h264,
  AVVideoWidthKey: width,
  AVVideoHeightKey: height,
  AVVideoCompressionPropertiesKey: [
    AVVideoAverageBitRateKey: 4_000_000,
    AVVideoProfileLevelKey: AVVideoProfileLevelH264HighAutoLevel,
  ]
]
let input = AVAssetWriterInput(mediaType: .video, outputSettings: videoSettings)
let attrs: [String: Any] = [
  kCVPixelBufferPixelFormatTypeKey as String: Int(kCVPixelFormatType_32BGRA),
  kCVPixelBufferWidthKey as String: width,
  kCVPixelBufferHeightKey as String: height,
  kCVPixelBufferCGImageCompatibilityKey as String: true,
  kCVPixelBufferCGBitmapContextCompatibilityKey as String: true,
]
let adaptor = AVAssetWriterInputPixelBufferAdaptor(assetWriterInput: input, sourcePixelBufferAttributes: attrs)
writer.add(input)

func col(_ r: CGFloat, _ g: CGFloat, _ b: CGFloat, _ a: CGFloat = 1.0) -> NSColor {
  NSColor(calibratedRed: r, green: g, blue: b, alpha: a)
}

func fillRounded(_ ctx: CGContext, _ rect: CGRect, _ radius: CGFloat, _ c: NSColor) {
  ctx.setFillColor(c.cgColor)
  let path = CGPath(roundedRect: rect, cornerWidth: radius, cornerHeight: radius, transform: nil)
  ctx.addPath(path)
  ctx.fillPath()
}

func strokeLine(_ ctx: CGContext, _ a: CGPoint, _ b: CGPoint, _ w: CGFloat, _ c: NSColor) {
  ctx.setStrokeColor(c.cgColor)
  ctx.setLineWidth(w)
  ctx.setLineCap(.round)
  ctx.move(to: a)
  ctx.addLine(to: b)
  ctx.strokePath()
}

writer.startWriting()
writer.startSession(atSourceTime: .zero)

for frame in 0..<totalFrames {
  while !input.isReadyForMoreMediaData { usleep(1000) }

  autoreleasepool {
    guard let pool = adaptor.pixelBufferPool else { return }
    var px: CVPixelBuffer?
    CVPixelBufferPoolCreatePixelBuffer(nil, pool, &px)
    guard let pixel = px else { return }

    CVPixelBufferLockBaseAddress(pixel, [])
    defer { CVPixelBufferUnlockBaseAddress(pixel, []) }

    guard let ctx = CGContext(
      data: CVPixelBufferGetBaseAddress(pixel),
      width: width,
      height: height,
      bitsPerComponent: 8,
      bytesPerRow: CVPixelBufferGetBytesPerRow(pixel),
      space: CGColorSpaceCreateDeviceRGB(),
      bitmapInfo: CGImageAlphaInfo.premultipliedFirst.rawValue
    ) else { return }

    let t = Double(frame) / Double(fps)
    let swing = sin(t * .pi * 2 / 3.0)
    let tap = sin(t * .pi * 2 * 2.0)
    let lookScreen = swing > 0

    // background
    fillRounded(ctx, CGRect(x: 0, y: 0, width: width, height: height), 0, col(0.02, 0.08, 0.18, 1))
    fillRounded(ctx, CGRect(x: 100, y: 510, width: 260, height: 120), 60, col(0.1, 0.7, 0.9, 0.12))
    fillRounded(ctx, CGRect(x: 960, y: 480, width: 220, height: 120), 60, col(0.1, 0.85, 0.55, 0.1))

    // desk
    fillRounded(ctx, CGRect(x: 120, y: 110, width: 1040, height: 190), 20, col(0.17, 0.22, 0.3, 0.95))

    // monitor
    fillRounded(ctx, CGRect(x: 760, y: 310, width: 320, height: 200), 16, col(0.08, 0.12, 0.19, 1))
    fillRounded(ctx, CGRect(x: 780, y: 330, width: 280, height: 150), 12, col(0.05, 0.38, 0.52, 0.95))
    for i in 0..<5 {
      let lineW = 210 + Int((sin(t * 2 + Double(i)) + 1) * 24)
      fillRounded(ctx, CGRect(x: 798, y: 352 + i * 22, width: lineW, height: 9), 4, col(0.58, 0.95, 0.94, 0.85))
    }

    // huge file stack
    for i in 0..<9 {
      fillRounded(ctx, CGRect(x: 170 + i * 7, y: 240 + i * 8, width: 230, height: 42), 7, col(0.58 - CGFloat(i) * 0.03, 0.67 - CGFloat(i) * 0.03, 0.78 - CGFloat(i) * 0.03, 0.95))
    }

    // folders + papers
    fillRounded(ctx, CGRect(x: 430, y: 250, width: 154, height: 60), 8, col(0.89, 0.67, 0.24, 0.95))
    fillRounded(ctx, CGRect(x: 446, y: 302, width: 124, height: 13), 6, col(0.95, 0.76, 0.35, 0.95))
    fillRounded(ctx, CGRect(x: 530 + Int(sin(t * 4) * 8), y: 226, width: 140, height: 95), 8, col(0.91, 0.95, 1.0, 0.96))
    fillRounded(ctx, CGRect(x: 622 + Int(cos(t * 3) * 6), y: 208, width: 126, height: 82), 8, col(0.88, 0.93, 0.99, 0.95))

    // analyst body
    let ax: CGFloat = 620
    let ay: CGFloat = 285
    let headShift: CGFloat = CGFloat(swing * 18)
    fillRounded(ctx, CGRect(x: ax - 56, y: ay - 26, width: 116, height: 92), 26, col(0.18, 0.47, 0.84, 1))
    fillRounded(ctx, CGRect(x: ax - 23 + headShift, y: ay + 56, width: 50, height: 50), 25, col(0.96, 0.8, 0.66, 1))

    // eyes
    let eyeY: CGFloat = ay + 84
    let pupil: CGFloat = lookScreen ? 3.5 : -3.5
    fillRounded(ctx, CGRect(x: ax - 10 + headShift, y: eyeY, width: 8, height: 8), 4, .white)
    fillRounded(ctx, CGRect(x: ax + 9 + headShift, y: eyeY, width: 8, height: 8), 4, .white)
    fillRounded(ctx, CGRect(x: ax - 8 + headShift + pupil, y: eyeY + 1, width: 4, height: 4), 2, .black)
    fillRounded(ctx, CGRect(x: ax + 11 + headShift + pupil, y: eyeY + 1, width: 4, height: 4), 2, .black)

    // sweat drops
    let sweatBase = CGFloat(ay + 102) - CGFloat((sin(t * 6) + 1) * 5)
    fillRounded(ctx, CGRect(x: ax + 34 + headShift, y: sweatBase, width: 6, height: 10), 3, col(0.58, 0.92, 1.0, 0.92))
    fillRounded(ctx, CGRect(x: ax + 42 + headShift, y: sweatBase - 11, width: 5, height: 8), 2.5, col(0.58, 0.92, 1.0, 0.85))

    // arms and action switching
    if lookScreen {
      strokeLine(ctx, CGPoint(x: ax - 24, y: ay + 24), CGPoint(x: ax + 8, y: ay + 6 + CGFloat(tap * 4)), 11, col(0.96, 0.8, 0.66, 1))
      strokeLine(ctx, CGPoint(x: ax + 34, y: ay + 24), CGPoint(x: ax + 84, y: ay + 4 - CGFloat(tap * 4)), 11, col(0.96, 0.8, 0.66, 1))
      fillRounded(ctx, CGRect(x: ax + 68, y: ay - 8, width: 120, height: 18), 8, col(0.12, 0.18, 0.28, 1))
    } else {
      strokeLine(ctx, CGPoint(x: ax - 24, y: ay + 24), CGPoint(x: ax - 70, y: ay + 6 + CGFloat(tap * 4)), 11, col(0.96, 0.8, 0.66, 1))
      strokeLine(ctx, CGPoint(x: ax + 34, y: ay + 24), CGPoint(x: ax - 8, y: ay - 10 - CGFloat(tap * 4)), 11, col(0.96, 0.8, 0.66, 1))
      strokeLine(ctx, CGPoint(x: 560, y: 250), CGPoint(x: 638, y: 272), 3, col(0.12, 0.24, 0.45, 0.9))
      strokeLine(ctx, CGPoint(x: 572, y: 238), CGPoint(x: 644, y: 257), 3, col(0.12, 0.24, 0.45, 0.85))
    }

    let cm = CMTime(value: CMTimeValue(frame), timescale: fps)
    adaptor.append(pixel, withPresentationTime: cm)
  }
}

input.markAsFinished()
let sem = DispatchSemaphore(value: 0)
writer.finishWriting {
  sem.signal()
}
_ = sem.wait(timeout: .now() + 30)

if writer.status == .completed {
  print("Generated: \(outURL.path)")
} else {
  print("Failed: \(writer.error?.localizedDescription ?? "Unknown")")
  exit(1)
}

param (
  [string]$outputFile = "$PSScriptRoot\sap_capture.png"
)

# === Define native WinAPI functions ===
Add-Type @"
  using System;
  using System.Runtime.InteropServices;
  using System.Text;

  public class WinAPI {
    [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
    [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);
    [DllImport("user32.dll")] public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);
    [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);

    public struct RECT {
      public int Left;
      public int Top;
      public int Right;
      public int Bottom;
    }
}
"@

# === Get the current active window handle ===
function Get-ForegroundHandle {
  return [WinAPI]::GetForegroundWindow()
}

# === Get window title (for debugging/logging) ===
function Get-WindowTitle($handle) {
  $builder = New-Object System.Text.StringBuilder 1024
  [WinAPI]::GetWindowText($handle, $builder, $builder.Capacity) | Out-Null
  return $builder.ToString()
}

# === Capture a window and save to file ===
function Capture-Window($handle, $outputPath) {
  $rect = New-Object WinAPI+RECT
  [WinAPI]::GetWindowRect($handle, [ref]$rect) | Out-Null

  $width  = $rect.Right - $rect.Left
  $height = $rect.Bottom - $rect.Top

  Add-Type -AssemblyName System.Windows.Forms
  Add-Type -AssemblyName System.Drawing

  $bmp = New-Object Drawing.Bitmap $width, $height
  $graphics = [Drawing.Graphics]::FromImage($bmp)
  $graphics.CopyFromScreen($rect.Left, $rect.Top, 0, 0, $bmp.Size)

  $bmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
}

# === Try to get the active window (retry up to 5 times) ===
$sapHandle = $null
$attempt = 0
while ($attempt -lt 5 -and ($sapHandle -eq 0 -or $sapHandle -eq $null)) {
  $sapHandle = Get-ForegroundHandle
  if ($sapHandle -eq 0 -or $sapHandle -eq $null) {
    Start-Sleep -Milliseconds 1000
    $attempt++
  }
}

# === Fail if no window found ===
if ($sapHandle -eq 0 -or $sapHandle -eq $null) {
  Write-Error "Could not detect any foreground window after 5 attempts"
  exit 1
}

# === Bring window to front (just in case) ===
[WinAPI]::SetForegroundWindow($sapHandle)
Start-Sleep -Milliseconds 300

# === Optional: log window title being captured ===
$title = Get-WindowTitle $sapHandle
Write-Output "Capturing window: '$title'"

# === Capture and save ===
try {
  Capture-Window $sapHandle $outputFile
  Write-Output "Capture successful: $outputFile"
  exit 0
} catch {
  Write-Error "Exception during capture: $_"
  exit 1
}

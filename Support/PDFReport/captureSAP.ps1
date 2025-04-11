param (
  [string]$outputFile = "$PSScriptRoot\sap_capture.png"
)

# === WinAPI definitions ===
Add-Type @"
using System;
using System.Runtime.InteropServices;
using System.Text;

public class WinAPI {
  public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);

  [DllImport("user32.dll")] public static extern bool EnumWindows(EnumWindowsProc lpEnumFunc, IntPtr lParam);
  [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr hWnd);
  [DllImport("user32.dll")] public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
  [DllImport("user32.dll")] public static extern bool IsIconic(IntPtr hWnd);
  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);

  public struct RECT {
    public int Left;
    public int Top;
    public int Right;
    public int Bottom;
  }
}
"@

# === Get window title ===
function Get-WindowTitle($handle) {
  $builder = New-Object System.Text.StringBuilder 1024
  [WinAPI]::GetWindowText($handle, $builder, $builder.Capacity) | Out-Null
  return $builder.ToString()
}

# === Get biggest SAP GUI window handle (with retry logic) ===
function Get-BiggestSAPWindow {
  $sapProc = Get-Process -Name "saplogon" -ErrorAction SilentlyContinue | Select-Object -First 1
  if (-not $sapProc) {
    Write-Error "❌ Could not find 'saplogon.exe'"
    return $null
  }

  $sapPid = $sapProc.Id
  $maxAttempts = 10
  $attempt = 0

  while ($attempt -lt $maxAttempts) {
    $script:largestArea = 0
    $script:biggestHandle = $null

    $callback = {
      param($hWnd, $lParam)

      $refPid = 0
      [WinAPI]::GetWindowThreadProcessId($hWnd, [ref]$refPid) | Out-Null

      if ($refPid -eq $sapPid -and [WinAPI]::IsWindowVisible($hWnd)) {
        $title = Get-WindowTitle($hWnd)
        if ($title -and $title -notlike "*SAP Logon*") {
          $rect = New-Object WinAPI+RECT
          [WinAPI]::GetWindowRect($hWnd, [ref]$rect) | Out-Null
          $width = $rect.Right - $rect.Left
          $height = $rect.Bottom - $rect.Top
          $area = $width * $height

          if ($area -gt $script:largestArea) {
            $script:largestArea = $area
            $script:biggestHandle = $hWnd
          }
        }
      }

      return $true
    }

    $enumDelegate = [WinAPI+EnumWindowsProc]$callback
    [WinAPI]::EnumWindows($enumDelegate, [IntPtr]::Zero) | Out-Null

    if ($script:biggestHandle -ne $null) {
      return $script:biggestHandle
    }

    Start-Sleep -Milliseconds 500
    $attempt++
  }

  return $null
}

# === Capture a window ===
function Capture-Window($handle, $outputPath) {
  $rect = New-Object WinAPI+RECT
  [WinAPI]::GetWindowRect($handle, [ref]$rect) | Out-Null

  $width = $rect.Right - $rect.Left
  $height = $rect.Bottom - $rect.Top

  Add-Type -AssemblyName System.Windows.Forms
  Add-Type -AssemblyName System.Drawing

  $bmp = New-Object Drawing.Bitmap $width, $height
  $graphics = [Drawing.Graphics]::FromImage($bmp)
  $graphics.CopyFromScreen($rect.Left, $rect.Top, 0, 0, $bmp.Size)
  $bmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
}

# === MAIN ===
$sapHandle = Get-BiggestSAPWindow

if ($sapHandle -eq $null -or $sapHandle -eq 0) {
  Write-Error "❌ No valid SAP GUI window found after retries."
  exit 1
}

if ([WinAPI]::IsIconic($sapHandle)) {
  Write-Warning "⚠️ SAP window is minimized. Please maximize it before capturing."
  exit 1
}

[WinAPI]::SetForegroundWindow($sapHandle)
Start-Sleep -Milliseconds 700

$title = Get-WindowTitle $sapHandle
Write-Output "🪟 Capturing SAP window: '$title' "

try {
  Capture-Window $sapHandle $outputFile
  Write-Output "✅ Screenshot saved to: $outputFile"
  exit 0
} catch {
  Write-Error "❌ Failed to capture SAP window: $_"
  exit 1
}

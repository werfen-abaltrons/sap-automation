param (
  [string]$outputFile = "$PSScriptRoot\sap_capture.png"
)

# === Define native WinAPI functions ===
Add-Type @"
using System;
using System.Runtime.InteropServices;
using System.Text;

public class WinAPI {
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
  [DllImport("user32.dll")] public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);
  [DllImport("user32.dll")] public static extern bool IsIconic(IntPtr hWnd);

  public struct RECT {
    public int Left;
    public int Top;
    public int Right;
    public int Bottom;
  }
}
"@

# === Get SAP GUI session handle (descarta SAP Logon) ===
function Get-SAPHandle {
  $sapProcs = Get-Process | Where-Object {
    $_.Name -like "sap*" -and $_.MainWindowHandle -ne 0
  }

  foreach ($proc in $sapProcs) {
    $builder = New-Object System.Text.StringBuilder 1024
    [WinAPI]::GetWindowText([intptr]$proc.MainWindowHandle, $builder, $builder.Capacity) | Out-Null
    $title = $builder.ToString()

    if ($title -notlike "*SAP Logon*") {
      return $proc.MainWindowHandle
    }
  }

  return $null
}

# === Get window title (for logging) ===
function Get-WindowTitle($handle) {
  $builder = New-Object System.Text.StringBuilder 1024
  [WinAPI]::GetWindowText([intptr]$handle, $builder, $builder.Capacity) | Out-Null
  return $builder.ToString()
}

# === Capture window ===
function Capture-Window($handle, $outputPath) {
  $rect = New-Object WinAPI+RECT
  [WinAPI]::GetWindowRect([intptr]$handle, [ref]$rect) | Out-Null

  $width  = $rect.Right - $rect.Left
  $height = $rect.Bottom - $rect.Top

  Add-Type -AssemblyName System.Windows.Forms
  Add-Type -AssemblyName System.Drawing

  $bmp = New-Object Drawing.Bitmap $width, $height
  $graphics = [Drawing.Graphics]::FromImage($bmp)
  $graphics.CopyFromScreen($rect.Left, $rect.Top, 0, 0, $bmp.Size)

  $bmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
}

# === Main logic ===
$sapHandle = Get-SAPHandle

if ($sapHandle -eq $null -or $sapHandle -eq 0) {
  Write-Error "❌ No se pudo encontrar una ventana de SAP válida (distinta a SAP Logon)"
  exit 1
}

# === Check if the window is minimized ===
if ([WinAPI]::IsIconic([intptr]$sapHandle)) {
  Write-Warning "⚠️ La ventana de SAP está minimizada. No se puede capturar correctamente. Maximízala primero."
  exit 1
}

[WinAPI]::SetForegroundWindow([intptr]$sapHandle)
Start-Sleep -Milliseconds 500

$title = Get-WindowTitle $sapHandle
Write-Output "🪟 Capturando ventana de SAP: '$title' "

try {
  Capture-Window $sapHandle $outputFile
  Write-Output "✅ Captura guardada en: $outputFile"
  exit 0
} catch {
  Write-Error "❌ Error durante la captura: $_"
  exit 1
}

Add-Type -AssemblyName System.Drawing
$root = Join-Path (Split-Path $PSScriptRoot -Parent) "miniprogram\assets\tab"
New-Item -ItemType Directory -Force -Path $root | Out-Null

function New-TabIcon {
  param(
    [string]$Path,
    [bool]$Active,
    [scriptblock]$Draw
  )
  $bmp = New-Object System.Drawing.Bitmap 81, 81
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  if ($Active) {
    $fg = [System.Drawing.Color]::FromArgb(255, 139, 107, 117)
  } else {
    $fg = [System.Drawing.Color]::FromArgb(255, 170, 170, 170)
  }
  $g.Clear([System.Drawing.Color]::FromArgb(0, 0, 0, 0))
  $pen = New-Object System.Drawing.Pen $fg, 4
  $brush = New-Object System.Drawing.SolidBrush $fg
  & $Draw $g $pen $brush
  $bmp.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose()
  $bmp.Dispose()
}

$drawHome = {
  param($g, $pen, $br)
  $g.DrawLine($pen, 40, 18, 18, 38)
  $g.DrawLine($pen, 40, 18, 62, 38)
  $g.DrawRectangle($pen, 24, 38, 32, 28)
}

$drawClass = {
  param($g, $pen, $br)
  $g.DrawLine($pen, 18, 26, 62, 26)
  $g.DrawLine($pen, 18, 40, 62, 40)
  $g.DrawLine($pen, 18, 54, 62, 54)
}

$drawSched = {
  param($g, $pen, $br)
  $g.DrawRectangle($pen, 20, 22, 40, 42)
  $g.DrawLine($pen, 20, 32, 60, 32)
  $g.DrawLine($pen, 28, 18, 28, 26)
  $g.DrawLine($pen, 52, 18, 52, 26)
}

$drawHw = {
  param($g, $pen, $br)
  $g.DrawRectangle($pen, 24, 18, 32, 48)
  $g.DrawLine($pen, 30, 30, 50, 30)
  $g.DrawLine($pen, 30, 40, 50, 40)
}

$drawProf = {
  param($g, $pen, $br)
  $g.DrawEllipse($pen, 28, 18, 24, 24)
  $g.DrawArc($pen, 14, 44, 52, 40, 200, 140)
}

New-TabIcon (Join-Path $root "home.png") $false $drawHome
New-TabIcon (Join-Path $root "home-active.png") $true $drawHome
New-TabIcon (Join-Path $root "class.png") $false $drawClass
New-TabIcon (Join-Path $root "class-active.png") $true $drawClass
New-TabIcon (Join-Path $root "schedule.png") $false $drawSched
New-TabIcon (Join-Path $root "schedule-active.png") $true $drawSched
New-TabIcon (Join-Path $root "homework.png") $false $drawHw
New-TabIcon (Join-Path $root "homework-active.png") $true $drawHw
New-TabIcon (Join-Path $root "profile.png") $false $drawProf
New-TabIcon (Join-Path $root "profile-active.png") $true $drawProf

Write-Host "OK:" (Get-ChildItem $root | Measure-Object).Count "files in $root"

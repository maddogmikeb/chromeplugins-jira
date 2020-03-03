Param(
    [Parameter(Mandatory = $true)]
    [bool]$IsReleaseBuild
)

$manifest = Get-Content -Raw -Path './src/manifest.json' | ConvertFrom-Json

Write-Host "Building $($manifest.name) $($manifest.version) ($(if ($IsReleaseBuild) { "Release" } else { "Debug" }))"

if (!(Test-Path -Path './obj/')) {
    New-Item -ItemType directory -Path './obj/'
}
if (!(Test-Path -Path './obj/release')) {
    New-Item -ItemType directory -Path './obj/release'
}
if (!(Test-Path -Path './obj/debug')) {
    New-Item -ItemType directory -Path './obj/debug'
}

if ($IsReleaseBuild) {
    Get-ChildItem -Path './obj/release' -Include * -File -Recurse | ForEach-Object { $_.Delete() }

    Copy-Item -Path './src/*' -Destination './obj/release/' -Force -Recurse

    Write-Host "Minifying..."
    Invoke-Expression "`./scripts/Minify-CSS.ps1` './obj/release/'"
    Invoke-Expression "`./scripts/Minify-Javascript.ps1` './obj/release/'"

    Write-Host "Archiving..."
    Compress-Archive -Path "./obj/release/*" -DestinationPath "./obj/release/$($manifest.name).zip" -force

    Write-Host "Cleaning..."
    Remove-Item "./obj/release/*" -Exclude "$($manifest.name).zip" -Force -Recurse
}
else {
    Get-ChildItem -Path './obj/debug' -Include * -File -Recurse | ForEach-Object { $_.Delete() }
    Copy-Item -Path './src/*' -Destination './obj/debug/' -Force -Recurse
}

Write-Host "Complete."
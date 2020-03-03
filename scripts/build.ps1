Param(
    [Parameter(Mandatory = $true)]
    [bool]$IsReleaseBuild
)

Write-Host "Building..."

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
    Invoke-Expression "`./scripts/minify_css.ps1` './obj/release/'"
    Invoke-Expression "`./scripts/minify_js.ps1` './obj/release/'"

    Write-Host "Creating Archive"
    Compress-Archive -Path './obj/release/*' -DestinationPath './obj/release/Jira Enricher.zip' -force

    Remove-Item './obj/release/*' -Exclude 'Jira Enricher.zip' -Force -Recurse
}
else {
    Get-ChildItem -Path './obj/debug' -Include * -File -Recurse | ForEach-Object { $_.Delete() }
    Copy-Item -Path './src/*' -Destination './obj/debug/' -Force -Recurse
}

Write-Host "Building Complete."
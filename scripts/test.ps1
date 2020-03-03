Write-Host "Staring Chrome with extension loaded"
Write-Debug "Loading extension from command line can only be done with new process so need to kill chrome process"
Stop-Process -Name "chrome" -Force
$path = "--load-extension=""$(( Resolve-Path (Join-Path -Path (Split-Path -Parent $PSCommandPath) -ChildPath "..\obj\debug\") ).ToString().Trim())\"""
Write-Debug $path
Start-Process -FilePath Chrome -ArgumentList @("--no-first-run", $path)
Write-Host "Completed"
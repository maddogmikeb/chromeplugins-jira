Write-Host "Creating Archive"
Compress-Archive -Path './Jira Enricher/*' -DestinationPath 'Jira Enricher.zip' -force
Write-Host "Completed"
Param(
    [Parameter(Mandatory = $true)]
    [string]$folder
)

try {
    $libPathEcma = $PSScriptRoot + "\..\lib\EcmaScript.NET.2.0.0\lib\netstandard2.0\EcmaScript.NET.dll"
    Add-Type -Path $libPathEcma | Out-Null

    $libPath = $PSScriptRoot + "\..\lib\YUICompressor.NET.3.0.0\lib\netstandard2.0\Yahoo.Yui.Compressor.dll"
    Add-Type -Path $libPath | Out-Null
}
catch [System.Reflection.ReflectionTypeLoadException] {
    Write-Host "Message: $($_.Exception.Message)"
    Write-Host "StackTrace: $($_.Exception.StackTrace)"
    Write-Host "LoaderExceptions: $($_.Exception.LoaderExceptions)"
}

$files = Get-ChildItem $folder -Recurse -Force -Include *.css
$i = 0
$total = ($files | Measure-Object ).Count

foreach ($file in $files) {
    try {
        $content = [IO.File]::ReadAllText($file.FullName)
        $cssCompressor = New-Object -TypeName Yahoo.Yui.Compressor.CssCompressor
        $compressedContent = $cssCompressor.Compress($content)
        Set-ItemProperty $file.FullName -name IsReadOnly -value $false
        [IO.File]::WriteAllText($file.FullName, $compressedContent)

        Write-Progress -Activity 'Minifying' -PercentComplete (($i / $total) * 100)
        $i++
    }
    catch [EcmaScript.NET.EcmaScriptRuntimeException] {
     Write-Warning "File: $($file.FullName)`nMessage: $($_)`nLineNumber: $($_.Exception.LineNumber)`nLineSource: $($_.Exception.LineSource)`nColumnNumber: $($_.Exception.ColumnNumber)"
    }
}

Write-Host "$i of $total CSS Files Minified."
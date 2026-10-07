[CmdletBinding()]
param([Parameter(ValueFromRemainingArguments = $true)][string[]]$InfraArguments)
$ErrorActionPreference = 'Stop'
$taskPython = $env:INFRA_PYTHON
if (-not $taskPython) {
    $taskPyLauncher = Get-Command py.exe -ErrorAction SilentlyContinue
    if ($taskPyLauncher) {
        $taskPython = & $taskPyLauncher.Source -3 -c 'import sys; print(sys.executable)'
        if ($LASTEXITCODE -ne 0) { $taskPython = $null }
    }
}
if (-not $taskPython) {
    $taskPythonCommand = Get-Command python.exe -ErrorAction SilentlyContinue
    if ($taskPythonCommand) { $taskPython = $taskPythonCommand.Source }
}
if (-not $taskPython) { throw 'Python 3.11+ is required. Set INFRA_PYTHON to its executable or install Python.' }
& $taskPython (Join-Path $PSScriptRoot 'scripts\infra.py') @InfraArguments
exit $LASTEXITCODE

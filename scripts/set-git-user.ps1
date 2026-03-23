<#
.SYNOPSIS
  Sets git user.name and user.email for this repo or globally.

.EXAMPLE
  .\scripts\set-git-user.ps1 -Name "Jane Doe" -Email "jane@example.com"
.EXAMPLE
  .\scripts\set-git-user.ps1 -Global -Name "Jane Doe" -Email "jane@example.com"
#>
param(
  [string] $Name,
  [string] $Email,
  [switch] $Global
)

$scope = if ($Global) { "--global" } else { "--local" }

if (-not $Name) {
  $Name = Read-Host "Git user.name"
}
if (-not $Email) {
  $Email = Read-Host "Git user.email"
}

if (-not $Name.Trim()) {
  Write-Error "user.name cannot be empty."
  exit 1
}
if (-not $Email.Trim()) {
  Write-Error "user.email cannot be empty."
  exit 1
}

git config $scope user.name $Name.Trim()
git config $scope user.email $Email.Trim()

Write-Host "Set ($scope):" -ForegroundColor Green
Write-Host "  user.name  = $(git config $scope user.name)"
Write-Host "  user.email = $(git config $scope user.email)"

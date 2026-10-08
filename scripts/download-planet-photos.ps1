$ErrorActionPreference = 'Stop'
$destination = Join-Path $PSScriptRoot '..\public\planet-photos'
New-Item -ItemType Directory -Force -Path $destination | Out-Null

$photos = [ordered]@{
  'sun.jpg' = 'https://assets.science.nasa.gov/dynamicimage/assets/science/psd/photojournal/pia/pia26/pia26681/PIA26681.jpg?crop=faces%2Cfocalpoint&fit=clip&h=700&w=700'
  'mercury.jpg' = 'https://assets.science.nasa.gov/dynamicimage/assets/science/psd/photojournal/pia/pia15/pia15163/PIA15163.jpg?crop=faces%2Cfocalpoint&fit=clip&h=700&w=700'
  'venus.png' = 'https://science.nasa.gov/wp-content/uploads/2023/05/venus-single.png'
  'earth.jpg' = 'https://assets.science.nasa.gov/dynamicimage/assets/science/psd/photojournal/pia/pia18/pia18033/PIA18033.jpg?crop=faces%2Cfocalpoint&fit=clip&h=700&w=700'
  'moon.jpg' = 'https://assets.science.nasa.gov/dynamicimage/assets/science/psd/solar/2023/09/1/14696484257_8b141cfe74_o-1.jpg?crop=faces%2Cfocalpoint&fit=clip&h=700&w=700'
  'mars.jpg' = 'https://assets.science.nasa.gov/dynamicimage/assets/science/psd/mars/downloadable_items/3/7/37983_mars-globe-valles-marineris-enhanced.jpg?crop=faces%2Cfocalpoint&fit=clip&h=700&w=700'
  'jupiter.png' = 'https://science.nasa.gov/wp-content/uploads/2024/03/hubble-jupiter-5jan2024-stsci-01hpmmsxbevgs2hk67vyvnveg5.png'
  'saturn.jpg' = 'https://science.nasa.gov/wp-content/uploads/2024/03/hubble-saturn-visible-light.jpg'
  'uranus.jpg' = 'https://assets.science.nasa.gov/dynamicimage/assets/science/psd/solar/2023/09/p/i/a/1/PIA18182-1.jpg?crop=faces%2Cfocalpoint&fit=clip&h=700&w=700'
  'neptune.jpg' = 'https://assets.science.nasa.gov/dynamicimage/assets/science/psd/solar/2023/09/p/i/a/0/PIA01492-1.jpg?crop=faces%2Cfocalpoint&fit=clip&h=700&w=700'
}

foreach ($photo in $photos.GetEnumerator()) {
  $path = Join-Path $destination $photo.Key
  curl.exe -L --fail --silent --show-error $photo.Value -o $path
  if ($LASTEXITCODE -ne 0) { throw "Could not download $($photo.Key)" }
  Write-Output "$($photo.Key): $((Get-Item -LiteralPath $path).Length) bytes"
}

// Shared startup and refresh feedback, driven by actual preparation progress.
export function setLoadingProgress(value) {
  const progress = document.querySelector('#loadingProgress');
  const percent = Math.max(progress.value, Math.min(100, Math.max(0, value)));
  progress.value = percent;
  document.querySelector('#loadingWordFill').style.clipPath = 'inset(0 ' + (100 - percent) + '% 0 0)';
}

export function setLoadingFailure(message) {
  document.querySelector('#loadingStatus').textContent = message;
  document.querySelector('#loadingScreen').classList.add('failed');
  document.querySelector('#loadingProgress').hidden = true;
}

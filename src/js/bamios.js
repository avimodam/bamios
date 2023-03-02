class Bamios {
  constructor(el, options) {
    const opts = options || {};

    this.player =
      typeof el === 'string' ? document.querySelector(el) : undefined;

    if (undefined === this.player || null === this.player)
      throw 'Cannot determine player element!';

    this.audio =
      typeof el === 'string'
        ? document.querySelector(el + ' audio')
        : undefined;

    if (undefined === this.audio || null === this.audio)
      throw 'Cannot determine audio element!';

    this.pauseOthersOnPlay =
      undefined !== opts.pauseOthersOnPlay ? opts.pauseOthersOnPlay : true;
    this.muted = false;
    this.isAdjustingTime = false;
    this.isClickedPlayBtn = false;

    this.initUi();
    this.initEvents();
  }

  initUi() {
    this.player.classList.add('bamios');

    // Volume control
    this.volumeCtl = document.createElement('div');
    this.volumeCtl.classList.add('bamios-volume-ctl');

    // Volume panel container
    this.volumePanelContainer = document.createElement('div');
    this.volumePanelContainer.classList.add('bamios-volume-panel-container');
    this.volumeCtl.append(this.volumePanelContainer);

    // Volume handle
    this.volumeHandle = document.createElement('div');
    this.volumeHandle.classList.add('bamios-volume-handle');
    this.volumePanelContainer.append(this.volumeHandle);

    // Volume panel
    this.volumePanel = document.createElement('div');
    this.volumePanel.classList.add('bamios-volume-panel');
    this.volumePanelContainer.append(this.volumePanel);

    // Volume slider
    this.volumeSlider = document.createElement('div');
    this.volumeSlider.classList.add('bamios-volume-slider');
    this.volumePanel.append(this.volumeSlider);

    // Volume button
    this.volumeBtn = document.createElement('button');
    this.volumeBtn.classList.add('bamios-btn');
    this.volumeBtn.classList.add('bamios-btn-volume');
    this.volumeBtn.innerHTML = Bamios.volumeIcon();
    this.volumeCtl.append(this.volumeBtn);

    // Controls left
    this.controlsLeft = document.createElement('div');
    this.controlsLeft.classList.add('bamios-left-controls');

    // Rewind button
    this.rewindBtn = document.createElement('button');
    this.rewindBtn.setAttribute('type', 'button');
    this.rewindBtn.setAttribute('title', 'Rewind');
    this.rewindBtn.classList.add('bamios-btn');
    this.rewindBtn.classList.add('bamios-btn-rewind');
    this.rewindBtn.innerHTML = Bamios.rewindIcon();
    this.controlsLeft.append(this.rewindBtn);

    // Play button
    this.playBtn = document.createElement('button');
    this.playBtn.classList.add('bamios-btn');
    this.playBtn.classList.add('bamios-btn-play-pause');
    this.playBtn.innerHTML = Bamios.playIcon();
    this.controlsLeft.append(this.playBtn);

    // Forward button
    this.forwardBtn = document.createElement('button');
    this.forwardBtn.classList.add('bamios-btn');
    this.forwardBtn.classList.add('bamios-btn-forward');
    this.forwardBtn.innerHTML = Bamios.forwardIcon();
    this.controlsLeft.append(this.forwardBtn);

    this.player.append(this.controlsLeft);

    // Controls right
    this.controlsRight = document.createElement('div');
    this.controlsRight.classList.add('bamios-right-controls');

    // Current time
    this.currentTimeText = document.createElement('div');
    this.currentTimeText.classList.add('bamios-current-time');
    this.currentTimeText.innerText = '00:00';
    this.controlsRight.append(this.currentTimeText);

    // Progress bar
    this.progressBar = document.createElement('div');
    this.progressBar.classList.add('bamios-progress-bar');

    // Progress
    this.progress = document.createElement('div');
    this.progress.classList.add('bamios-progress-list');
    this.playProgress = document.createElement('div');
    this.playProgress.classList.add('bamios-play-progress');
    this.progress.append(this.playProgress);

    // Progress handle
    this.progressHandle = document.createElement('div');
    this.progressHandle.classList.add('bamios-progress-handle');
    this.progressBar.append(this.progressHandle);
    this.progressBar.append(this.progress);

    // Add duration bar
    this.controlsRight.append(this.progressBar);

    // Duration
    this.duration = document.createElement('div');
    this.duration.classList.add('bamios-duration');
    this.duration.innerText = '00:00';
    this.controlsRight.append(this.duration);

    // Volume control
    this.controlsRight.append(this.volumeCtl);
    this.volumeSlider.style.width = '100%';

    this.player.append(this.controlsRight);
  }

  initEvents() {
    let mouseClickedProgressBar = false;
    let mouseEnteredProgressBar = false;
    let mouseClickedVolumeWrapper = false;
    let mouseEnteredVolumeWrapper = false;
    let mouseEnteredVolumeCtl = false;
    let mouseHoverVolumeCtl = false;

    this.audio.onloadedmetadata = () => {
      this.duration.innerText = Bamios.toTimeString(this.audio.duration);
      this.volumeHandle.style.transform =
        'translate(' + (this.audio.volume * 80 - 8) + 'px, -50%)';
    };

    this.audio.ontimeupdate = () => {
      this.currentTimeText.innerHTML = Bamios.toTimeString(
        this.audio.currentTime
      );
      let currentPercent =
        (this.audio.currentTime / this.audio.duration) * 100 + '%';
      this.playProgress.style.width = currentPercent;
      if (!mouseClickedProgressBar) {
        this.progressHandle.style.transform =
          'translate(' +
          (this.playProgress.getBoundingClientRect().width - 8) +
          'px, -50%)';
      }
    };

    this.audio.onended = () => {
      this.stop();
    };

    this.rewindBtn.addEventListener('click', () => {
      this.audio.currentTime = this.audio.currentTime - 10;
    });

    this.forwardBtn.addEventListener('click', () => {
      this.audio.currentTime = this.audio.currentTime + 10;
    });

    this.playBtn.addEventListener('click', (playBtnEvent) => {
      if (
        !playBtnEvent.currentTarget.classList.contains('bamios-playing') &&
        this.pauseOthersOnPlay
      ) {
        Bamios.pauseOtherPlayers();
      }

      if (!playBtnEvent.currentTarget.classList.contains('bamios-playing')) {
        this.isClickedPlayBtn = true;
        Bamios.playPlayer(this.player);
      } else {
        this.isClickedPlayBtn = false;
        Bamios.pausePlayer(this.player);
      }
    });

    this.progressBar.addEventListener('mousedown', (progressBarEvent) => {
      mouseClickedProgressBar = true;
      this.isAdjustingTime = true;
      this.pause();
      const offsetX =
        progressBarEvent.clientX -
        this.progressBar.getBoundingClientRect().left;

      if (
        offsetX >= 0 &&
        offsetX <= this.progressBar.getBoundingClientRect().width
      ) {
        const second =
          (offsetX / this.progressBar.getBoundingClientRect().width) *
          this.audio.duration;
        this.setCurrentTime(second);
        this.progressHandle.style.transform =
          'translate(' + (offsetX - 8) + 'px, -50%)';
      }
    });

    window.addEventListener('mouseup', () => {
      mouseClickedProgressBar = false;

      if (this.isAdjustingTime) {
        this.isAdjustingTime = false;
        if (this.pauseOthersOnPlay && this.isClickedPlayBtn) {
          Bamios.pauseOtherPlayers();
          this.play();
        }
      }

      if (!mouseEnteredProgressBar) {
        this.progressHandle.style.transition = 'opacity 0.6s ease-in-out';
        this.progressHandle.style.opacity = 0;
      }

      if (!this.muted) {
        this.audio.muted = false;
      }
    });

    this.progressBar.addEventListener('mouseenter', () => {
      mouseEnteredProgressBar = true;
      this.progressHandle.style.display = 'block';
      this.progressHandle.style.transition = 'opacity 0.15s ease-in-out';
      this.progressHandle.style.opacity = 1;
    });

    this.progressBar.addEventListener('mouseleave', () => {
      mouseEnteredProgressBar = false;

      if (!mouseClickedProgressBar) {
        this.progressHandle.style.display = 'none';
        this.progressHandle.style.transition = 'opacity 0.6s ease-in-out';
        this.progressHandle.style.opacity = 0;
      }
    });

    window.addEventListener('mousemove', (progressBarEvent) => {
      if (mouseClickedProgressBar) {
        this.audio.muted = true;
        const offsetX =
          progressBarEvent.clientX -
          this.progressBar.getBoundingClientRect().left;
        const second =
          (offsetX / this.progressBar.getBoundingClientRect().width) *
          this.audio.duration;

        if (
          offsetX >= 0 &&
          offsetX <= this.progressBar.getBoundingClientRect().width
        ) {
          this.progressHandle.style.transform =
            'translate(' + (offsetX - 8) + 'px, -50%)';
          this.setCurrentTime(second);
        }
      }
    });

    this.volumeBtn.addEventListener('click', (volumeBtnEvent) => {
      if (this.audio.volume > 0) {
        if (!volumeBtnEvent.currentTarget.classList.contains('muted')) {
          volumeBtnEvent.currentTarget.classList.add('muted');
          volumeBtnEvent.currentTarget.innerHTML = Bamios.volumeOffIcon();
          this.volumeSlider.style.width = '0%';
          this.volumeHandle.style.transform = 'translate(-8px, -50%)';
          this.audio.muted = true;
          this.muted = true;
        } else {
          volumeBtnEvent.currentTarget.classList.remove('muted');
          volumeBtnEvent.currentTarget.innerHTML = Bamios.volumeIcon();
          this.volumeSlider.style.width = this.audio.volume * 100 + '%';
          this.volumeHandle.style.transform =
            'translate(' + (this.audio.volume * 80 - 8) + 'px, -50%)';
          this.audio.muted = false;
          this.muted = false;
        }
      }
    });

    this.volumeCtl.addEventListener('mouseenter', () => {
      mouseHoverVolumeCtl = true;

      if (window.innerWidth > 520) {
        this.volumePanel.style.width = '80px';
        this.volumeCtl.style.paddingLeft = '15px';
        this.volumeCtl.style.background = 'rgba(0, 0, 0, 0.04)';
        this.volumePanelContainer.style.marginRight = '10px';
        this.volumePanel.style.opacity = 1;
        setTimeout(() => {
          if (mouseHoverVolumeCtl && !this.audio.muted) {
            this.volumeHandle.style.transform =
              'translate(' + (this.audio.volume * 80 - 8) + 'px, -50%)';
          }
        }, 150);
      }
    });

    this.volumeCtl.addEventListener('mouseleave', () => {
      if (!mouseClickedVolumeWrapper) {
        mouseHoverVolumeCtl = false;
        this.volumePanel.style.width = 0;
        this.volumeCtl.style.paddingLeft = 0;
        this.volumeCtl.style.background = 'transparent';
        this.volumePanelContainer.style.marginRight = 0;
        this.volumePanel.style.opacity = 0;
        this.volumeHandle.style.opacity = 0;
        this.volumeHandle.style.display = 'none';
      }
    });

    this.volumeCtl.addEventListener('mouseenter', () => {
      mouseEnteredVolumeCtl = true;
    });

    this.volumeCtl.addEventListener('mouseleave', () => {
      mouseEnteredVolumeCtl = false;
    });

    this.volumePanelContainer.addEventListener(
      'mousedown',
      (volumePanelContainerEvent) => {
        mouseClickedVolumeWrapper = true;
        const offsetX =
          volumePanelContainerEvent.clientX -
          this.volumePanelContainer.getBoundingClientRect().left;

        if (offsetX >= 0 && offsetX <= 80) {
          let volume = offsetX / 80;

          if (volume < 0) volume = 0;
          if (volume > 1) volume = 1;

          this.audio.volume = volume;
          this.volumeSlider.style.width = volume * 100 + '%';
          this.volumeHandle.style.transform =
            'translate(' + (offsetX - 8) + 'px, -50%)';

          if (volume <= 0) {
            this.volumeBtn.innerHTML = Bamios.volumeOffIcon();
            this.audio.muted = true;
            this.muted = true;
          } else if (volume <= 0.6) {
            this.volumeBtn.innerHTML = Bamios.volumeLowIcon();
            this.audio.muted = false;
            this.muted = false;
          } else {
            this.volumeBtn.innerHTML = Bamios.volumeIcon();
            this.audio.muted = false;
            this.muted = false;
          }
        }
      }
    );

    window.addEventListener('mouseup', () => {
      mouseClickedVolumeWrapper = false;

      if (!mouseEnteredVolumeWrapper) {
        this.volumeHandle.style.opacity = 0;
        this.volumeHandle.style.display = 'none';
      }

      if (!mouseEnteredVolumeCtl) {
        this.volumePanel.style.width = 0;
        this.volumeCtl.style.paddingLeft = 0;
        this.volumeCtl.style.background = 'transparent';
        this.volumePanelContainer.style.marginRight = 0;
        this.volumePanel.style.opacity = 0;
      }
    });

    window.addEventListener('mousemove', (volumePanelContainerEvent) => {
      if (mouseClickedVolumeWrapper) {
        const offsetX =
          volumePanelContainerEvent.clientX -
          this.volumePanelContainer.getBoundingClientRect().left;
        let volume = offsetX / 80;

        if (volume < 0) volume = 0;
        if (volume > 1) volume = 1;

        if (offsetX <= 0) {
          this.audio.volume = 0;
          this.volumeSlider.style.width = 0;
          this.volumeHandle.style.transform = 'translate(-8px, -50%)';
        } else if (
          offsetX > 0 &&
          offsetX <= this.volumePanelContainer.getBoundingClientRect().width
        ) {
          this.audio.volume = volume;
          this.volumeSlider.style.width = volume * 100 + '%';
          this.volumeHandle.style.transform =
            'translate(' + (offsetX - 8) + 'px, -50%)';
        } else {
          this.audio.volume = 1;
          this.volumeSlider.style.width = '100%';
          this.volumeHandle.style.transform =
            'translate(' + (80 - 8) + 'px, -50%)';
        }

        if (volume <= 0) {
          this.volumeBtn.innerHTML = Bamios.volumeOffIcon();
          this.audio.muted = true;
          this.muted = true;
        } else if (volume <= 0.5) {
          this.volumeBtn.innerHTML = Bamios.volumeLowIcon();
          this.audio.muted = false;
          this.muted = false;
        } else {
          this.volumeBtn.innerHTML = Bamios.volumeIcon();
          this.audio.muted = false;
          this.muted = false;
        }
      }
    });

    this.volumePanelContainer.addEventListener('mouseenter', () => {
      mouseEnteredVolumeWrapper = true;
      this.volumeHandle.style.opacity = 1;
      this.volumeHandle.style.display = 'block';
    });

    this.volumePanelContainer.addEventListener('mouseleave', () => {
      mouseEnteredVolumeWrapper = false;

      if (!mouseClickedVolumeWrapper) {
        this.volumeHandle.style.opacity = 0;
        this.volumeHandle.style.display = 'none';
      }
    });
  }

  play() {
    if (!this.isPlaying && this.pauseOthersOnPlay) {
      Bamios.pauseOtherPlayers();
    }

    Bamios.playPlayer(this.player);
  }

  pause() {
    Bamios.pausePlayer(this.player);
  }

  stop() {
    Bamios.pausePlayer(this.player);
    this.audio.currentTime = 0;
  }

  setCurrentTime(second) {
    if (second >= 0 && second <= this.audio.duration) {
      this.audio.currentTime = second;
    }
  }

  setPauseOthersOnPlay(pauseOthersOnPlay) {
    this.pauseOthersOnPlay = pauseOthersOnPlay;
  }

  static playIcon() {
    return '<svg viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.56 10.87l-6.07 3.44A1 1 0 019 15.45v-6.9a1 1 0 011.46-.86l6.07 3.44a1 1 0 01.03 1.74z"/></svg>';
  }

  static pauseIcon() {
    return '<svg viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm-1.24 13a1.5 1.5 0 01-3 0V9a1.5 1.5 0 013 0v6zm5.48 0a1.5 1.5 0 01-3 0V9a1.5 1.5 0 013 0v6z"/></svg>';
  }

  static rewindIcon() {
    return '<svg viewBox="0 0 24 24"><path d="M8.72 10.324l-.59.436a.55.55 0 01-.35.109c-.16 0-.3-.06-.42-.18s-.18-.264-.18-.43c0-.214.103-.387.31-.521l1.44-.96a.646.646 0 01.225-.1c.083-.018.161-.028.235-.028.193 0 .346.059.46.175.113.117.17.262.17.436v5.78a.579.579 0 01-.185.436.67.67 0 01-.475.173.635.635 0 01-.46-.175.584.584 0 01-.18-.436v-4.715zm5.219 5.426c-.572 0-1.058-.151-1.454-.455-.397-.303-.699-.727-.905-1.27s-.31-1.168-.31-1.875c0-.713.104-1.34.31-1.88s.508-.962.905-1.265c.396-.304.882-.455 1.454-.455.574 0 1.059.151 1.455.455.396.303.699.725.906 1.265.206.54.31 1.167.31 1.88 0 .707-.104 1.333-.31 1.875-.207.543-.51.967-.906 1.27-.396.304-.88.455-1.455.455zm0-1.199c.281 0 .522-.089.726-.266s.362-.443.476-.8.17-.802.17-1.335c0-.54-.057-.986-.17-1.34s-.272-.618-.476-.795-.444-.265-.726-.265a1.07 1.07 0 00-.719.266c-.207.177-.367.441-.48.795-.114.354-.17.8-.17 1.34 0 .533.056.979.17 1.335.113.356.273.623.48.8.207.176.446.265.719.265zm4.081-8.567A8.457 8.457 0 0012.011 3.5L12 3.502V2.53a.58.58 0 00-.94-.45l-2.43 2a.57.57 0 000 .92l2.43 2a.58.58 0 00.94-.53V5.5h.011c1.735 0 3.367.675 4.597 1.9a6.47 6.47 0 011.913 4.601 6.463 6.463 0 01-1.9 4.605 6.47 6.47 0 01-4.6 1.913h-.011a6.47 6.47 0 01-4.595-1.899 6.469 6.469 0 01-1.915-4.6 6.557 6.557 0 011.925-4.63 1 1 0 00-1.409-1.42A8.573 8.573 0 003.5 12.022a8.456 8.456 0 002.501 6.014 8.45 8.45 0 006.007 2.483h.015a8.452 8.452 0 006.013-2.501 8.455 8.455 0 002.484-6.021 8.45 8.45 0 00-2.5-6.013z"/></svg>';
  }

  static forwardIcon() {
    return '<svg viewBox="0 0 24 24"><path d="M8.72 10.324l-.59.436a.55.55 0 01-.35.109c-.16 0-.3-.06-.42-.18s-.18-.264-.18-.43c0-.214.103-.387.31-.521l1.44-.96a.646.646 0 01.225-.1c.083-.018.161-.028.235-.028.193 0 .346.059.46.175.113.117.17.262.17.436v5.78a.579.579 0 01-.185.436.67.67 0 01-.475.173.635.635 0 01-.46-.175.584.584 0 01-.18-.436v-4.715zm5.219 5.426c-.572 0-1.058-.151-1.454-.455-.397-.303-.699-.727-.905-1.27s-.31-1.168-.31-1.875c0-.713.104-1.34.31-1.88s.508-.962.905-1.265c.396-.304.882-.455 1.454-.455.574 0 1.059.151 1.455.455.396.303.699.725.906 1.265.206.54.31 1.167.31 1.88 0 .707-.104 1.333-.31 1.875-.207.543-.51.967-.906 1.27-.396.304-.88.455-1.455.455zm0-1.199c.281 0 .522-.089.726-.266s.362-.443.476-.8.17-.802.17-1.335c0-.54-.057-.986-.17-1.34s-.272-.618-.476-.795-.444-.265-.726-.265a1.07 1.07 0 00-.719.266c-.207.177-.367.441-.48.795-.114.354-.17.8-.17 1.34 0 .533.056.979.17 1.335.113.356.273.623.48.8.207.176.446.265.719.265zm4.045-8.58a1 1 0 10-1.408 1.419 6.548 6.548 0 011.923 4.629 6.472 6.472 0 01-1.913 4.601 6.466 6.466 0 01-4.595 1.899h-.011a6.472 6.472 0 01-4.601-1.913 6.467 6.467 0 01-1.9-4.605A6.473 6.473 0 017.393 7.4a6.465 6.465 0 014.597-1.9h.011v.97a.579.579 0 00.939.53l2.43-2a.57.57 0 000-.92l-2.43-2a.58.58 0 00-.94.45v.97h-.011A8.455 8.455 0 005.98 5.984a8.456 8.456 0 00-2.501 6.014c-.003 2.272.879 4.411 2.484 6.021s3.741 2.498 6.014 2.501h.014c2.268 0 4.4-.882 6.007-2.483a8.456 8.456 0 002.501-6.014 8.562 8.562 0 00-2.515-6.052z"/></svg>';
  }

  static volumeIcon() {
    return '<svg viewBox="0 0 24 24"><path d="M13.5 4.23v15.54a1.8 1.8 0 01-3.19 1.13l-4-4.9H4.2a1.7 1.7 0 01-1.7-1.7V9.7A1.7 1.7 0 014.2 8h2.11l4-4.9a1.8 1.8 0 013.19 1.13zm5.771 14.661c3.793-3.8 3.793-9.982-.001-13.78a.751.751 0 00-1.061 1.06c3.209 3.214 3.209 8.445-.001 11.66a.752.752 0 00.531 1.281.759.759 0 00.532-.221zm-2.121-2.12c2.627-2.631 2.627-6.911 0-9.541a.751.751 0 00-1.061 1.06 5.258 5.258 0 010 7.42.75.75 0 101.061 1.061z"/></svg>';
  }

  static volumeLowIcon() {
    return '<svg viewBox="0 0 24 24"><path d="M13.5 4.23v15.54a1.8 1.8 0 01-3.19 1.13l-4-4.9H4.2a1.7 1.7 0 01-1.7-1.7V9.7A1.7 1.7 0 014.2 8h2.11l4-4.9a1.8 1.8 0 013.19 1.13zm3.65 12.541c2.627-2.631 2.627-6.911 0-9.541a.751.751 0 00-1.061 1.06 5.258 5.258 0 010 7.42.75.75 0 101.061 1.061z"/></svg>';
  }

  static volumeOffIcon() {
    return '<svg viewBox="0 0 24 24"><path d="M13.5 4.23v15.54a1.8 1.8 0 01-3.19 1.13l-4-4.9H4.2a1.7 1.7 0 01-1.7-1.7V9.7A1.7 1.7 0 014.2 8h2.11l4-4.9a1.8 1.8 0 013.19 1.13zm8.03 10.55a.75.75 0 000-1.061l-4.5-4.5a.75.75 0 10-1.061 1.061l4.5 4.5a.748.748 0 001.061 0zm-4.5 0l4.5-4.5a.75.75 0 10-1.061-1.061l-4.5 4.5a.75.75 0 101.061 1.061z"/></svg>';
  }

  static playPlayer(player) {
    const playPauseButton = player.querySelector('.bamios-btn-play-pause');
    const audio = player.querySelector('audio');
    playPauseButton.classList.add('bamios-playing');
    playPauseButton.innerHTML = Bamios.pauseIcon();
    audio.play();
  }

  static pausePlayer(player) {
    const playPauseButton = player.querySelector('.bamios-btn-play-pause');
    const audio = player.querySelector('audio');
    playPauseButton.classList.remove('bamios-playing');
    playPauseButton.innerHTML = Bamios.playIcon();
    audio.pause();
  }

  static pauseOtherPlayers() {
    const players = document.querySelectorAll('.bamios');

    for (let i = 0; i < players.length; i++) {
      Bamios.pausePlayer(players[i]);
    }
  }

  static toTimeString(totalSeconds) {
    const totalMinutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    const minutes = Math.floor(totalMinutes % 60);

    return (
      minutes.toString().padStart(2, '0') +
      ':' +
      seconds.toString().padStart(2, '0')
    );
  }
}

export default Bamios;

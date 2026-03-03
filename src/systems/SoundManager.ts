import soundConfig from '../data/sounds.json';

interface SoundDef {
  id: string;
  file: string;
  type: string;
  tags: string[];
}

export class SoundManager {
  private static instance: SoundManager;
  private bgmAudio: HTMLAudioElement;
  private currentBgmTag: string | null = null;
  private bgmVolume: number = 0.5;
  private sfxVolume: number = 0.5;
  private playlist: SoundDef[] = [];
  private currentTrackIndex: number = 0;
  private nextTrackTimer: any = null; // Timer for pause between songs

  private constructor() {
    // Prevent multiple audio instances during HMR (Hot Module Replacement)
    if ((window as any).__SOUND_MANAGER_AUDIO__) {
      const oldAudio = (window as any).__SOUND_MANAGER_AUDIO__;
      oldAudio.pause();
      oldAudio.src = '';
    }

    this.bgmAudio = new Audio();
    (window as any).__SOUND_MANAGER_AUDIO__ = this.bgmAudio;
    
    this.bgmAudio.volume = this.bgmVolume;
    
    // When track ends, play next after delay
    this.bgmAudio.addEventListener('ended', () => {
      // 2 seconds pause between songs
      this.nextTrackTimer = setTimeout(() => {
        this.playNextTrack();
      }, 2000);
    });
    
    // Handle errors
    this.bgmAudio.addEventListener('error', (e) => {
      console.error('Audio playback error:', e);
      // Try next track on error to avoid silence
      this.nextTrackTimer = setTimeout(() => this.playNextTrack(), 1000);
    });

    // Fade out logic
    this.bgmAudio.addEventListener('timeupdate', () => {
      const duration = this.bgmAudio.duration;
      const currentTime = this.bgmAudio.currentTime;
      
      if (duration && currentTime) {
        const fadeTime = 3; // 3 seconds fade out
        const timeLeft = duration - currentTime;
        
        if (timeLeft <= fadeTime) {
          // Fading out
          const fadeRatio = Math.max(0, timeLeft / fadeTime);
          this.bgmAudio.volume = this.bgmVolume * fadeRatio;
        } else {
          // Normal volume (restore if needed)
          // We check diff > 0.01 to avoid setting it constantly if it's already correct
          if (Math.abs(this.bgmAudio.volume - this.bgmVolume) > 0.01) {
             this.bgmAudio.volume = this.bgmVolume;
          }
        }
      }
    });

    // Auto-play unlocker
    const unlockHandler = () => {
      if (this.bgmAudio.src && this.bgmAudio.paused && this.currentBgmTag) {
        this.bgmAudio.play().catch(() => {});
      }
      // We don't remove listener immediately because one interaction might not be enough or it might be a different issue
      // But for simple auto-play policy, one click is enough.
      // Let's keep it simple: just try to play if we have a track and are paused.
    };
    document.addEventListener('click', unlockHandler, { once: true });
    document.addEventListener('keydown', unlockHandler, { once: true });
  }

  public static getInstance(): SoundManager {
    if (!SoundManager.instance) {
      SoundManager.instance = new SoundManager();
    }
    return SoundManager.instance;
  }

  public playBGM(tag: string) {
    if (this.currentBgmTag === tag) return; // Already playing this tag

    // Clear any pending next track timer
    if (this.nextTrackTimer) {
      clearTimeout(this.nextTrackTimer);
      this.nextTrackTimer = null;
    }

    this.currentBgmTag = tag;
    
    // Filter sounds by tag and type 'bgm'
    this.playlist = soundConfig.filter(s => 
      s.type === 'bgm' && s.tags.includes(tag)
    );

    if (this.playlist.length === 0) {
      console.warn(`No BGM found for tag: ${tag}`);
      this.stopBGM();
      return;
    }

    // Shuffle or start from 0? User said "one by one and repeat". 
    // Let's shuffle once to keep it fresh, or just sequential. 
    // Sequential is safer for "one by one".
    this.currentTrackIndex = 0;
    this.playCurrentTrack();
  }

  public stopBGM() {
    if (this.nextTrackTimer) {
      clearTimeout(this.nextTrackTimer);
      this.nextTrackTimer = null;
    }
    this.bgmAudio.pause();
    this.bgmAudio.currentTime = 0;
    this.currentBgmTag = null;
  }

  public playSFX(id: string) {
    // Find SFX
    const sfxDef = soundConfig.find(s => s.type === 'sfx' && s.id === id);
    if (!sfxDef) {
      console.warn(`SFX not found: ${id}`);
      return;
    }

    const audio = new Audio(this.getAudioUrl(sfxDef.file));
    audio.volume = this.sfxVolume;
    audio.play().catch(e => console.error('Failed to play SFX', e));
  }

  public setBGMVolume(volume: number) {
    this.bgmVolume = Math.max(0, Math.min(1, volume));
    
    // Immediate update unless fading out
    const duration = this.bgmAudio.duration;
    const currentTime = this.bgmAudio.currentTime;
    const fadeTime = 3;

    if (duration && (duration - currentTime <= fadeTime)) {
         // In fade window, calculate current factor based on new volume
         const timeLeft = duration - currentTime;
         const fadeRatio = Math.max(0, timeLeft / fadeTime);
         this.bgmAudio.volume = this.bgmVolume * fadeRatio;
    } else {
         this.bgmAudio.volume = this.bgmVolume;
    }
  }

  public getBGMVolume(): number {
    return this.bgmVolume;
  }

  public setSFXVolume(volume: number) {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
  }

  public getSFXVolume(): number {
    return this.sfxVolume;
  }

  private playNextTrack() {
    if (this.playlist.length === 0) return;

    this.currentTrackIndex = (this.currentTrackIndex + 1) % this.playlist.length;
    this.playCurrentTrack();
  }

  private playCurrentTrack() {
    if (this.playlist.length === 0) return;

    const track = this.playlist[this.currentTrackIndex];
    const url = this.getAudioUrl(track.file);
    
    this.bgmAudio.src = url;
    this.bgmAudio.volume = this.bgmVolume; // Reset volume for new track
    this.bgmAudio.play().catch(e => {
      // Auto-play policy might block this.
      // We can only log it. The user needs to interact with the page first.
      console.warn('Auto-play blocked or failed:', e);
    });
  }

  private getAudioUrl(filename: string): string {
    const baseUrl = import.meta.env.BASE_URL;
    // public/musics/filename
    // If BASE_URL is '/', then '/musics/filename'
    // If BASE_URL is '/game/', then '/game/musics/filename'
    const cleanBase = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';
    return `${cleanBase}musics/${filename}`;
  }
}

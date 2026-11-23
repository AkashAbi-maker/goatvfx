
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { flushSync } from "react-dom";
import gsap from "gsap";
import * as THREE from "three";

function activateVideo(video: HTMLVideoElement | null) {
  if (!video) return;
  video.preload = "auto";
  video.load();
}



// ============================================
// CINEMATIC INTRO + WEB PULL
// ============================================

function CinematicIntro({
  onComplete,
  isActive,
  animationsEnabled,
  onToggleAnimations,
}: {
  onComplete: () => void;
  isActive: boolean;
  animationsEnabled: boolean;
  onToggleAnimations: () => void;
}) {
  // States
  const [showUniverse, setShowUniverse] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [pullStartedState, setPullStartedState] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [logoVisible, setLogoVisible] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const welcomeVisible = showUniverse;

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const universeRef = useRef<HTMLVideoElement>(null);
  const brandRef = useRef<HTMLDivElement>(null);
  const introSceneRef = useRef<HTMLDivElement>(null);
  const webPullAudioRef = useRef<HTMLAudioElement>(null);

  const transitionStarted = useRef(false);
  const pullStarted = useRef(false);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const pullWatchdogRef = useRef<number | null>(null);
  const wasActive = useRef(isActive);

  // Restore the looping universe screen when BACK is clicked.
  useEffect(() => {
    if (isActive && !wasActive.current) {
      timelineRef.current?.kill();
      timelineRef.current = null;
      if (pullWatchdogRef.current) clearTimeout(pullWatchdogRef.current);
      pullWatchdogRef.current = null;
      pullStarted.current = false;
      setPullStartedState(false);

      if (introSceneRef.current) {
        gsap.set(introSceneRef.current, { clearProps: "opacity" });
      }

      if (webPullAudioRef.current) {
        webPullAudioRef.current.pause();
        webPullAudioRef.current.currentTime = 0;
      }

      setShowUniverse(true);
      setIsPulling(false);
      setLogoVisible(true);

      if (webPullAudioRef.current) {
        webPullAudioRef.current.pause();
        webPullAudioRef.current.currentTime = 0;
      }

      if (brandRef.current) {
        gsap.set(brandRef.current, {
          clearProps: "transform,opacity",
        });
      }

      if (universeRef.current) {
        activateVideo(universeRef.current);
        gsap.set(universeRef.current, { opacity: 0, clearProps: "transform" });
        void universeRef.current.play().catch((error) => {
          console.error("Universe playback failed:", error);
        });
        gsap.to(universeRef.current, {
          opacity: 1,
          duration: 0.45,
          ease: "power2.out",
        });
      }
    }

    wasActive.current = isActive;
  }, [isActive]);

  // Portal video speed
useEffect(() => {
  const video = videoRef.current;

  if (video) {
    video.playbackRate = 1;
  }
}, []);

  // ------------------------------------------
  // 1. START PORTAL VIDEO
  // ------------------------------------------

  useEffect(() => {
    if (!isActive || showUniverse) return;
    if (!animationsEnabled) {
      transitionStarted.current = true;
      // Synchronize the intro UI with the user's motion preference.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowUniverse(true);
      setLogoVisible(true);
      const portal = videoRef.current;
      const universe = universeRef.current;
      if (portal) { portal.pause(); portal.muted = true; }
      if (universe) {
        universe.currentTime = 0;
        activateVideo(universe);
        void universe.play().catch((error) => console.warn("Universe loop playback failed:", error));
      }
      return;
    }
    const video = videoRef.current;
    if (!video) return;
    activateVideo(video);

    let cancelled = false;

    const startVideo = async () => {
      try {
        video.muted = false;
        video.volume = 1;

        await video.play();

        if (!cancelled) {
          setIsMuted(false);
          setSoundEnabled(true);
        }
      } catch {
        if (cancelled) return;

        video.muted = true;
        setIsMuted(true);
        setSoundEnabled(false);

        try {
          await video.play();
        } catch (error) {
          console.error("Portal playback failed:", error);
        }
      }
    };

    void startVideo();

    return () => {
      cancelled = true;
    };
  }, [isActive, animationsEnabled, showUniverse]);

  // When cinematic mode is switched off while the portal is playing, move
  // directly to the looping Section 01 screen.
  useEffect(() => {
    if (isActive && !animationsEnabled && !showUniverse) {
      transitionStarted.current = false;
      const portal = videoRef.current;
      if (portal) { portal.pause(); portal.muted = true; }
      // Synchronize component state with media and motion preference.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsMuted(true);
      setSoundEnabled(false);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowUniverse(true);
      setLogoVisible(true);
      const universe = universeRef.current;
      if (universe) {
        universe.currentTime = 0;
        activateVideo(universe);
        void universe.play().catch((error) => console.warn("Universe loop playback failed:", error));
      }
    }
  }, [animationsEnabled, isActive, showUniverse]);

  // ------------------------------------------
  // 2. UNIVERSE VIDEO READY
  // ------------------------------------------

  // ------------------------------------------
  // 3. SOUND ON / OFF
  // ------------------------------------------

  const toggleSound = async () => {
    const video = videoRef.current;

    if (!video) return;

    if (soundEnabled) {
      video.muted = true;
      setIsMuted(true);
      setSoundEnabled(false);
      return;
    }

    try {
      video.muted = false;
      video.volume = 1;

      await video.play();

      setIsMuted(false);
      setSoundEnabled(true);
    } catch (error) {
      console.error("Could not enable sound:", error);
    }
  };

  // ------------------------------------------
  // 4. LOGO REVEAL
  // ------------------------------------------

  const handleTimeUpdate = () => {
    const video = videoRef.current;

    if (!video) return;

    if (video.currentTime >= 5/1.35) {
      setLogoVisible(true);
    }
  };

  // ------------------------------------------
  // 5. PORTAL TO UNIVERSE TRANSITION
  // ------------------------------------------

  const startUniverse = () => {
  if (transitionStarted.current) return;

  transitionStarted.current = true;

  const portal = videoRef.current;
  const universe = universeRef.current;

  if (portal) {
    portal.pause();
    portal.muted = true;
    portal.currentTime = 0;
  }

  setIsMuted(true);
  setSoundEnabled(false);
  setLogoVisible(true);
  setShowUniverse(true);

  if (universe) {
    universe.currentTime = 0;

    universe.play().catch((error) => {
      console.error("Universe playback failed:", error);
    });
  }
};
// ADD THIS FUNCTION
const skipIntro = () => {
  void startUniverse();
};
  // Turning cinematic mode OFF immediately stops every Section 01 intro layer.
  useEffect(() => {
    if (animationsEnabled) return;

    const portal = videoRef.current;
    const pullAudio = webPullAudioRef.current;
    portal?.pause();
    if (pullAudio) {
      pullAudio.pause();
      pullAudio.currentTime = 0;
    }
    // Stop the active transition when the motion preference changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsPulling(false);
    setIsMuted(true);
    setSoundEnabled(false);
  }, [animationsEnabled]);

  // ------------------------------------------
  // 6. WEB PULL ANIMATION
  // ------------------------------------------

 
const triggerWebPull = useCallback(() => {
    if (!isActive || !showUniverse || pullStarted.current) return;

    // Cinematic mode OFF: skip the web-pull GIF, sound and GSAP transition.
    // Move straight to Section 02.
    if (!animationsEnabled) {
      pullStarted.current = true;
      setPullStartedState(true);
      setIsPulling(false);
      const portal = videoRef.current;
      const pullAudio = webPullAudioRef.current;
      portal?.pause();
      if (pullAudio) {
        pullAudio.pause();
        pullAudio.currentTime = 0;
      }
      onComplete();
      return;
    }

    const scene = introSceneRef.current;
    const audio = webPullAudioRef.current;
    if (!scene) return;

    if (pullWatchdogRef.current) clearTimeout(pullWatchdogRef.current);
    pullWatchdogRef.current = window.setTimeout(() => {
      if (!pullStarted.current || !isActive) return;
      timelineRef.current?.kill();
      setIsPulling(false);
      onComplete();
    }, 5000);

    // Lock synchronously so repeated button clicks cannot restart the pull.
    pullStarted.current = true;
    setPullStartedState(true);

    // Start the visual and its sound from the same user gesture. GIF assets
    // loop automatically, so remove this one after one short pull beat.
    setIsPulling(true);

    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      void audio.play().catch((error) => {
        console.warn("Web pull sound could not play:", error);
      });
    }

    const startSinglePull = () => {
    // Give the web pull a slightly longer beat, then use a short fade.
      const timeline = gsap.timeline({
        onComplete: () => {
          if (pullWatchdogRef.current) clearTimeout(pullWatchdogRef.current);
          pullWatchdogRef.current = null;
          setIsPulling(false);
          onComplete();
        },
      });

      timelineRef.current = timeline;

      // Keep the web pull visible for one full 1.08 s loop before fading
      // the intro away, so the transition does not flash black mid-animation.
      timeline.to({}, { duration: 0.9 });
      timeline.to(scene, {
        opacity: 0,
        duration: 0.18,
        ease: "power2.inOut",
      });
    };
    startSinglePull();
  }, [isActive, showUniverse, onComplete, animationsEnabled]);


// ------------------------------------------
  // ------------------------------------------
  // 8. CLEAN UP GSAP
  // ------------------------------------------

  useEffect(() => {
    return () => {
      timelineRef.current?.kill();
      if (pullWatchdogRef.current) clearTimeout(pullWatchdogRef.current);
    };
  }, []);

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div
      ref={introSceneRef}
      style={{ display: isActive ? "block" : "none", opacity: 1 }}
      className={`cinematic-intro ${
        showUniverse ? "universe-active" : ""
      }`}
    >
    <audio
      ref={webPullAudioRef}
      src="/videos/web-pull-shoot.mp3"
      preload="metadata"
    />
      {/* PORTAL VIDEO */}

      <video
        ref={videoRef}
        className="intro-video"
        autoPlay={animationsEnabled && !showUniverse}
        muted={isMuted}
        playsInline
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => void startUniverse()}
      >
        <source
          src="/videos/portal-opening.720p.mp4"
          type="video/mp4"
        />
      </video>

      {/* UNIVERSE LOOP VIDEO */}

<video
  ref={universeRef}
  className="intro-loop-video"
  muted
  loop
  playsInline
  preload="none"
>
  <source
    src="/videos/universe-loop.mp4"
    type="video/mp4"
  />
</video>

      {/* TRANSITION FLASH */}

      <div className="portal-transition-flash" />

      {/* SINGLE WEB PULL ANIMATION */}


{isPulling && (
  <img
    key="goat-web-pull-final"
    src="/videos/goat-vfx-web-pull-final.webp"
    alt=""
    className="web-pull-animation"
  />
)}

      {/* STUDIO LOGO */}

      <div
        ref={brandRef}
        className={`intro-brand ${
          logoVisible ? "brand-visible" : ""
        } ${showUniverse ? "loop-brand" : ""}`}
      >
        <p className="intro-eyebrow">
          A NEW DIMENSION OF VISUAL EFFECTS
        </p>

        <img className="intro-logo-overlay" src="/images/logo-overlay.png" alt="The Goat VFX" />

        <p className="intro-tagline">
          BEYOND REALITY. BEYOND IMAGINATION.
        </p>
      </div>

      {/* Section 01 welcome reveal — shown after the portal/title-card sequence */}
      {showUniverse && (
        <div
          className={`intro-welcome ${welcomeVisible ? "welcome-visible" : ""}`}
          aria-live="polite"
        >
          <p className="intro-welcome-kicker">
            <span className="intro-welcome-sparkles" aria-hidden="true">
              <i /><i /><i /><i /><i /><i /><i />
            </span>
            <span>WELCOME TO GOAT VFX</span>
            <span className="intro-welcome-sparkles" aria-hidden="true">
              <i /><i /><i /><i /><i /><i /><i />
            </span>
          </p>
          <h2>Where imagination becomes visual reality.</h2>
          <p className="intro-welcome-copy">
            Explore our VFX, CGI, animation and cinematic storytelling.
          </p>
        </div>
      )}

      {/* GLOBAL CINEMATIC INTRO TOGGLE */}
      <button
        type="button"
        className={`intro-animation-toggle ${animationsEnabled ? "is-on" : "is-off"}`}
        onClick={onToggleAnimations}
        aria-pressed={animationsEnabled}
        title="Enable or disable intro animations between sections"
      >
        <span className="intro-animation-toggle-dot" />
        INTRO ANIMATION <strong>{animationsEnabled ? "ON" : "OFF"}</strong>
      </button>

      {/* SOUND CONTROL */}

      {!showUniverse && (
        <button
          className="intro-sound-hint"
          onClick={toggleSound}
        >
          {soundEnabled ? "◖ SOUND ON" : "◖ SOUND OFF"}
        </button>
      )}

      {/* SKIP INTRO */}

      {!showUniverse && (
        <button
          className="intro-skip-button"
          onClick={skipIntro}
        >
          SKIP INTRO ↗
        </button>
      )}

      {/* WEB PULL BUTTON */}

      {showUniverse && (
        <button
          type="button"
          className="intro-next-button"
          onClick={triggerWebPull}
          disabled={pullStartedState}
          aria-busy={pullStartedState}
        >
          <span>EXPLORE OUR WORK</span>
          <span aria-hidden="true">↗</span>
        </button>
      )}

    </div>
  );
}


function OurWorkSection({ onBack, onNext, isLeaving, isEntering, isHidden }: { onBack: () => void; onNext: () => void; isLeaving: boolean; isEntering: boolean; isHidden: boolean }) {
  const backgroundVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = backgroundVideoRef.current;
    if (!video) return;
    if (isHidden) {
      video.pause();
    } else {
      activateVideo(video);
      void video.play().catch(() => {});
    }
  }, [isHidden]);

  const categories = [
    {
      number: "01",
      title: "VFX PROJECTS",
      description: "Cinematic visual effects and professional compositing.",
      icon: "✦",
    },
    {
      number: "02",
      title: "CGI CREATIONS",
      description: "Photorealistic 3D worlds and environments.",
      icon: "◇",
    },
    {
      number: "03",
      title: "ANIMATION",
      description: "Creative motion graphics and cinematic animation.",
      icon: "◈",
    },
    {
      number: "04",
      title: "SHOWREELS",
      description: "A collection of our finest visual productions.",
      icon: "▷",
    },
    {
      number: "05",
      title: "VISUAL EXPERIMENTS",
      description: "Experimental visuals pushing creative boundaries.",
      icon: "◎",
    },
  ];

  return (
    <section id="our-work" hidden={isHidden} className={`our-work-section ${isLeaving ? "our-work-leaving" : ""} ${isEntering ? "our-work-entering" : ""}`} aria-label="Our work">

      <video
        ref={backgroundVideoRef}
        className="our-work-background-video"
        muted
        loop
        playsInline
        preload="none"
      >
        <source
          src="/videos/goat-vfx-section2-spiderman-background.optimized.mp4"
          type="video/mp4"
        />
      </video>

      <div className="our-work-dark-overlay" />

      <img
        src="/images/spider_man_no_way_home_title_png__by_bennibarra_dg03w7f.png"
        alt="Spider-Man: No Way Home"
        className="our-work-spiderman-title-overlay"
      />

      <img
        src="/videos/goat-vfx-hanging-spider-fast.webp"
        alt=""
        aria-hidden="true"
        loading="lazy"
        decoding="async"
        className="our-work-hanging-spider"
      />

      <div className="our-work-content">

        <div className="our-work-logo-stage">
          <img
            src="/videos/goat-vfx-section2-four-corner-web-animated-transparent.webp"
            alt=""
            aria-hidden="true"
            loading="lazy"
            decoding="async"
            className="our-work-corner-web"
          />

          <div className="our-work-brand">
            <span className="our-work-brand-small">THE</span>
            <h1>GOAT <span>VFX</span></h1>
            <div className="our-work-brand-line">
              BEYOND REALITY. BEYOND IMAGINATION.
            </div>
          </div>
        </div>

        <div className="our-work-heading">
          <div className="our-work-divider">
            <span />
            <h2>OUR WORK</h2>
            <span />
          </div>

          <p className="our-work-description">
            A showcase of our cinematic creations — VFX, CGI,
            Animation, Showreels and Visual Experiments.
          </p>
        </div>

        <div className="our-work-categories">
          {categories.map((item) => (
            <article className="our-work-card" key={item.number}>
              <span className="our-work-card-number">
                {item.number}
              </span>

              <span className="our-work-card-icon">
                {item.icon}
              </span>

              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </div>

        <div className="our-work-actions">

          <button
            type="button"
            className="our-work-nav-button our-work-back-button"
            onClick={onBack}
          >
            <span className="nav-arrow">←</span>
            <span>BACK</span>
          </button>
<button
            type="button"
            className="our-work-nav-button our-work-next-button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              if (!isLeaving) onNext();
            }}
            disabled={isLeaving}
            aria-label="Continue to Section 03"
          >
            <span>NEXT</span>
            <span className="nav-arrow">→</span>
          </button>

        </div>

        <div className="our-work-footer">
          VISUAL EFFECTS · CGI · ANIMATION · CREATIVE PRODUCTION
        </div>

      </div>
    </section>
  );
}
function Section03Transition({ onComplete }: { onComplete: () => void }) {
  const introRef = useRef<HTMLVideoElement>(null);
  const finishTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finishStartedRef = useRef(false);
  const [isFading, setIsFading] = useState(false);
  const [needsSoundGesture, setNeedsSoundGesture] = useState(false);

  const finishIntro = useCallback(() => {
    if (finishStartedRef.current) return;
    finishStartedRef.current = true;
    setIsFading(true);
    finishTimerRef.current = setTimeout(onComplete, 220);
  }, [onComplete]);

  useEffect(() => {
    const video = introRef.current;
    if (!video) return;

    activateVideo(video);
    let disposed = false;
    video.currentTime = 0;
    video.playbackRate = 1;
    video.muted = false;
    video.defaultMuted = false;
    video.volume = 1;

    const onPlaying = () => setNeedsSoundGesture(false);
    const onError = () => finishIntro();
    video.addEventListener("playing", onPlaying);
    video.addEventListener("error", onError);

    // Do not force-skip on a slow start or temporary buffering. The intro
    // remains visible until it ends, errors, or the visitor chooses Skip.
    void video.play().catch((error) => {
      if (disposed || (error instanceof Error && error.name === "AbortError")) return;
      if (error instanceof Error && error.name === "NotAllowedError") {
        setNeedsSoundGesture(true);
        return;
      }
      console.warn("Iron Man intro playback failed:", error);
    });

    return () => {
      disposed = true;
      video.removeEventListener("playing", onPlaying);
      video.removeEventListener("error", onError);
      if (finishTimerRef.current) clearTimeout(finishTimerRef.current);
      video.pause();
    };
  }, [finishIntro]);

  const playIntroWithSound = async () => {
    const video = introRef.current;
    if (!video) return;
    video.muted = false;
    video.defaultMuted = false;
    video.volume = 1;
    try {
      await video.play();
      setNeedsSoundGesture(false);
    } catch (error) {
      console.warn("Could not start Iron Man intro with sound:", error);
    }
  };

  const skipIntro = () => {
    if (finishTimerRef.current) clearTimeout(finishTimerRef.current);
    finishStartedRef.current = true;
    introRef.current?.pause();
    onComplete();
  };

  return (
    <div className={`section-03-intro-screen ${isFading ? "is-fading" : ""}`}>
      <video
        ref={introRef}
        className="section-03-intro-video"
        autoPlay
        playsInline
        preload="metadata"
        onEnded={finishIntro}
        onError={finishIntro}
      >
        <source src="/videos/ironman-intro-optimized.mp4" type="video/mp4" />
      </video>
      {needsSoundGesture && (
        <button type="button" className="section-03-intro-sound-start" onClick={() => void playIntroWithSound()}>
          ▶ PLAY INTRO WITH SOUND
        </button>
      )}
      <button type="button" className="section-03-skip-intro" onClick={skipIntro}>SKIP INTRO</button>
    </div>
  );
}

function Section03({ onBack, onNext, isLeaving = false, isHidden = false }: { onBack: () => void; onNext: () => void; isLeaving?: boolean; isHidden?: boolean }) {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const background = section?.querySelector<HTMLVideoElement>(".section-03-background-video");
    const spark = section?.querySelector<HTMLVideoElement>(".section-03-spark-video");
    if (!background) return;

    background.muted = true;
    background.loop = true;
    if (spark) {
      spark.muted = true;
      spark.loop = true;
      spark.preload = "auto";
    }

    const stopVideos = () => {
      background.pause();
      spark?.pause();
    };

    const startBackground = () => {
      if (!isHidden && document.visibilityState !== "hidden") {
        void background.play().catch((error) => {
          if (error instanceof Error && error.name !== "AbortError") {
            console.warn("Section 03 background playback failed:", error);
          }
        });
      }
    };

    const playVideos = () => {
      if (isHidden || document.visibilityState === "hidden") {
        stopVideos();
        return;
      }

      // Keep the background and the visible spark overlay in sync with this section.
      if (background.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
        void background.play().catch((error) => {
          if (error instanceof Error && error.name !== "AbortError") {
            console.warn("Section 03 background playback failed:", error);
          }
        });
      } else {
        activateVideo(background);
        background.addEventListener("canplay", startBackground, { once: true });
      }

      if (spark) {
        void spark.play().catch((error) => {
          if (error instanceof Error && error.name !== "AbortError") {
            console.warn("Section 03 spark overlay playback failed:", error);
          }
        });
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") stopVideos();
      else playVideos();
    };

    playVideos();
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      background.removeEventListener("canplay", startBackground);
      stopVideos();
    };
  }, [isHidden]);

  const factors = [
    {
      number: "01",
      title: "OUR PROCESS",
      description:
        "From concept to final frame, a streamlined and collaborative production workflow.",
      icon: "✧",
    },
    {
      number: "02",
      title: "TECHNOLOGY & TOOLS",
      description:
        "Powered by industry-leading VFX, 3D and AI-assisted production tools.",
      icon: "▦",
    },
    {
      number: "03",
      title: "INDUSTRIES WE CREATE FOR",
      description:
        "Films, OTT, Advertising, Brands, Gaming and Immersive Media.",
      icon: "▣",
    },
    {
      number: "04",
      title: "OUR ACHIEVEMENTS",
      description:
        "A growing portfolio of impactful projects and creative collaborations.",
      icon: "✺",
    },
    {
      number: "05",
      title: "THE TEAM",
      description:
        "A passionate team of artists, tech artists and storytellers who bring visions to life.",
      icon: "♧",
    },
  ];

  const highlights = [
    { value: "50+", label: "Projects", icon: "▤" },
    { value: "15+", label: "Creative Professionals", icon: "♧" },
    { value: "Multiple", label: "Industry Collaborations", icon: "🏆" },
    { value: "End-to-End", label: "Production Support", icon: "ϟ" },
    { value: "Global", label: "Creative Standards", icon: "◎" },
  ];

  return (
  <section ref={sectionRef} id="section-03" hidden={isHidden} className={`section-03 ${isLeaving ? "section-transition-leaving" : ""}`}>

    {/* Iron Man background */}
    <video
      className="section-03-background-video"
      muted
      loop
      playsInline
      preload="metadata"
      aria-hidden="true"
    >
      <source
        src="/videos/ironman-background.720p.mp4"
        type="video/mp4"
      />
    </video>

    <div className="section-03-overlay" />

    <img
      className="section-03-avengers-logo-overlay"
      src="/images/avengers_infinity_war_logo_pre_release_2014__by_wesleyvianen_dfv16va.png"
      alt="Avengers: Infinity War"
    />

    {/* Main content */}
    <div className="section-03-content">

      {/* Central holographic creative-ecosystem stage. Decorative only;
          original logo and spark video remain unchanged. */}
      <div className="section-03-reactor-stage" aria-hidden="true">
        <div className="section-03-reactor-orbit section-03-reactor-orbit-a" />
        <div className="section-03-reactor-orbit section-03-reactor-orbit-b" />
        <div className="section-03-reactor-orbit section-03-reactor-orbit-c" />
        <div className="section-03-reactor-core">
          <span className="section-03-reactor-play">▶</span>
        </div>
        <div className="section-03-reactor-platform">
          <span />
          <span />
          <span />
        </div>
        <p>OUR CREATIVE ECOSYSTEM</p>
      </div>

      {/* Logo and spark */}
      <div className="section-03-brand-lockup" aria-label="THE GOAT VFX">

        <video
          className="section-03-spark-video"
          src="/videos/spark-effect.mp4"
          muted
          loop
          playsInline
          preload="none"
          aria-hidden="true"
        />

        <div className="section-03-brand-wordmark">
          <span className="section-03-brand-the">THE</span>
          <span className="section-03-brand-name">
            GOAT <span>VFX</span>
          </span>
        </div>

      </div>


    {/* KEEP YOUR EXISTING SECTION 03 HEADER, CARDS,
        HIGHLIGHTS AND OTHER CONTENT HERE */}

        <header className="section-03-header">
          <p className="section-03-eyebrow">
            <span /> WHY CHOOSE US
          </p>
          <h1>
            THE POWER
            <br />
            BEHIND
            <br />
            <span>EVERY FRAME.</span>
          </h1>
          <p className="section-03-intro-copy">
            A creative VFX studio that blends technology, artistry and
            storytelling to deliver world-class visual experiences.
          </p>
        </header>

        <div className="section-03-factors">
          {factors.map((factor) => (
            <article className="section-03-card" key={factor.number}>
              <span className="section-03-card-number">{factor.number}</span>
              <span className="section-03-card-icon" aria-hidden="true">
                {factor.icon}
              </span>
              <h2>{factor.title}</h2>
              <p>{factor.description}</p>
              <span className="section-03-card-arrow" aria-hidden="true">
                ↗
              </span>
            </article>
          ))}
        </div>

        <div className="section-03-highlights">
          {highlights.map((item) => (
            <div className="section-03-highlight" key={item.label}>
              <span className="section-03-highlight-icon" aria-hidden="true">
                {item.icon}
              </span>
              <div>
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </div>
            </div>
          ))}
        </div>

        <nav className="section-03-navigation" aria-label="Section navigation">
          <button type="button" onClick={onBack}>
            <span>←</span><span>BACK</span>
          </button>
          <button type="button" onClick={onNext}>
            <span>NEXT</span><span>→</span>
          </button>
        </nav>
      </div>
    </section>
  );
}


function Section04Placeholder({
  onBack,
  onNext,
  onBackgroundReady,
  isTransitionReady,
  introRequested,
  isHidden = false,
}: {
  onBack: () => void;
  onNext: () => void;
  onBackgroundReady: () => void;
  isTransitionReady: boolean;
  introRequested: boolean;
  isHidden?: boolean;
}) {

  const [selectedRing, setSelectedRing] = useState(0);
  const ringRefs = useRef<(HTMLButtonElement | null)[]>([]);
const detailPanelRef = useRef<HTMLDivElement>(null);
const selectionTimelineRef = useRef<gsap.core.Timeline | null>(null);

const handleRingSelect = (index: number) => {
  if (index === selectedRing) {
    // Replay the activation animation for the selected ring.
    const currentRing = ringRefs.current[index];

    if (currentRing) {
      gsap.fromTo(
        currentRing,
        { scale: 1.35, rotationY: 0, z: 80 },
        {
          scale: 1.12,
          rotationY: 360,
          z: 0,
          duration: 0.75,
          ease: "power3.out",
          overwrite: "auto",
        }
      );
    }
    return;
  }

  selectionTimelineRef.current?.kill();

  const previousRing = ringRefs.current[selectedRing];
  const nextRing = ringRefs.current[index];
  const panel = detailPanelRef.current;

  setSelectedRing(index);

  const timeline = gsap.timeline();
  selectionTimelineRef.current = timeline;

  if (previousRing) {
    timeline.to(
      previousRing,
      {
        scale: 1,
        rotationY: 0,
        z: 0,
        duration: 0.45,
        ease: "power2.out",
      },
      0
    );
  }

  if (nextRing) {
    timeline.fromTo(
      nextRing,
      {
        scale: 0.85,
        rotationY: -65,
        z: -80,
      },
      {
        scale: 1.35,
        rotationY: 360,
        z: 80,
        duration: 0.75,
        ease: "back.out(1.5)",
      },
      0
    );
  }

  if (panel) {
    timeline.fromTo(
      panel,
      {
        opacity: 0.35,
        y: 18,
        filter: "blur(5px)",
      },
      {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        duration: 0.55,
        ease: "power3.out",
      },
      0.12
    );
  }
};
  // Do not start the Section 04 intro while Section 03 is still visible.
  // First let the incoming background complete its crossfade, then play the intro.
  const [introPlaying, setIntroPlaying] = useState(false);
  const [introFading, setIntroFading] = useState(false);
  const [introHasFinished, setIntroHasFinished] = useState(false);
  const [needsSoundGesture, setNeedsSoundGesture] = useState(false);
  const [selectedUniverse, setSelectedUniverse] = useState<number | null>(null);
  const section04BackgroundRef = useRef<HTMLVideoElement>(null);
  const introVideoRef = useRef<HTMLVideoElement>(null);
  const introFadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const introSafetyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const introFadeStartedRef = useRef(false);
  const lastIntroRequestRef = useRef(false);

  // Keep the heavy looping background idle while the full-screen intro is
  // playing. It is started only after the intro has completed or been skipped.
  useEffect(() => {
    const background = section04BackgroundRef.current;
    if (!background) return;

    background.muted = true;
    background.loop = true;

    if (isHidden || introPlaying || (introRequested && !introHasFinished)) {
      background.pause();
      return;
    }

    activateVideo(background);
    void background.play().catch((error) => {
      if (error instanceof Error && error.name === "AbortError") return;
      console.warn("Section 04 background playback failed:", error);
    });

    return () => background.pause();
  }, [introHasFinished, introPlaying, introRequested, isHidden]);

  const finishSection04Intro = useCallback(() => {
    if (introFadeStartedRef.current) return;
    introFadeStartedRef.current = true;
    setNeedsSoundGesture(false);
    if (introSafetyTimerRef.current) clearTimeout(introSafetyTimerRef.current);
    introSafetyTimerRef.current = null;
    introVideoRef.current?.pause();
    setIntroFading(true);

    if (introFadeTimerRef.current) clearTimeout(introFadeTimerRef.current);
    introFadeTimerRef.current = setTimeout(() => {
      setIntroPlaying(false);
      setIntroHasFinished(true);
      introFadeTimerRef.current = null;
    }, 450);
  }, []);

  const skipSection04Intro = () => {
    if (introSafetyTimerRef.current) clearTimeout(introSafetyTimerRef.current);
    introSafetyTimerRef.current = null;
    if (introFadeTimerRef.current) clearTimeout(introFadeTimerRef.current);
    introFadeTimerRef.current = null;
    introFadeStartedRef.current = true;
    introVideoRef.current?.pause();
    setNeedsSoundGesture(false);
    setIntroFading(false);
    setIntroPlaying(false);
    setIntroHasFinished(true);
  };

  useEffect(() => {
    const requestStarted = introRequested && !lastIntroRequestRef.current;
    lastIntroRequestRef.current = introRequested;
    if (!requestStarted || isHidden) return;

    if (introFadeTimerRef.current) clearTimeout(introFadeTimerRef.current);
    introFadeTimerRef.current = null;
    introFadeStartedRef.current = false;
    setIntroFading(false);
    setIntroHasFinished(false);
    setNeedsSoundGesture(false);
    setIntroPlaying(true);
    activateVideo(introVideoRef.current);
    // This short sting must never hold navigation indefinitely if the browser
    // gets stuck before firing playing, waiting, ended, or error.
    if (introSafetyTimerRef.current) clearTimeout(introSafetyTimerRef.current);
    introSafetyTimerRef.current = setTimeout(finishSection04Intro, 12000);
  }, [finishSection04Intro, introRequested, isHidden]);

  // Mirror the proven Iron Man intro playback lifecycle: one controlled play
  // attempt, a playing event to confirm startup, no premature startup timeout,
  // and complete listener/timer cleanup when the intro leaves the screen.
  useEffect(() => {
    if (!introPlaying || isHidden) return;

    const video = introVideoRef.current;
    if (!video) return;
    activateVideo(video);

    let disposed = false;
    const onPlaying = () => {
      if (!disposed) setNeedsSoundGesture(false);
    };
    const onError = () => {
      if (!disposed) {
        console.error("Could not load /videos/section4-intro.mp4");
        finishSection04Intro();
      }
    };

    video.addEventListener("playing", onPlaying);
    video.addEventListener("error", onError);
    video.muted = false;
    video.defaultMuted = false;
    video.volume = 1;

    const startVideo = async () => {
      try {
        video.currentTime = 0;
      } catch {
        // The browser may not have metadata yet; playback starts at its beginning.
      }

      // The intro is mounted only after an explicit Section 04 request. Its
      // source starts loading on mount, so avoid calling load() again here:
      // that would restart the fetch immediately before playback.
      try {
        await video.play();
      } catch (error) {
        if (disposed || (error instanceof Error && error.name === "AbortError")) return;
        if (error instanceof Error && error.name === "NotAllowedError") {
          setNeedsSoundGesture(true);
          return;
        }
        console.warn("Section 04 intro playback failed:", error);
      }
    };

    void startVideo();

    return () => {
      disposed = true;
      video.removeEventListener("playing", onPlaying);
      video.removeEventListener("error", onError);
      video.pause();
      if (introSafetyTimerRef.current) clearTimeout(introSafetyTimerRef.current);
      introSafetyTimerRef.current = null;
      if (introFadeTimerRef.current) clearTimeout(introFadeTimerRef.current);
      introFadeTimerRef.current = null;
    };
  }, [finishSection04Intro, introPlaying, isHidden]);

  const playSection04IntroWithSound = async () => {
    const video = introVideoRef.current;
    if (!video) return;
    video.muted = false;
    video.defaultMuted = false;
    video.volume = 1;
    try {
      await video.play();
      setNeedsSoundGesture(false);
    } catch (error) {
      console.warn("Could not start Section 04 intro with sound:", error);
    }
  };

  const rings = [
    {
      number: "01",
      title: "VISUAL EFFECTS",
      description:
        "Cinematic compositing, simulations and spectacular visual effects.",
      icon: "✦",
    },
    {
      number: "02",
      title: "3D & CGI",
      description:
        "Photorealistic modelling, texturing, lighting and rendering.",
      icon: "◇",
    },
    {
      number: "03",
      title: "3D ANIMATION",
      description:
        "Bringing characters, objects and environments to life through motion.",
      icon: "◉",
    },
    {
      number: "04",
      title: "MOTION GRAPHICS",
      description:
        "Dynamic visual communication, motion design and animated graphics.",
      icon: "▱",
    },
    {
      number: "05",
      title: "AI-POWERED CREATION",
      description:
        "AI-assisted visual production and creative experimentation.",
      icon: "▣",
    },
    {
      number: "06",
      title: "DIGITAL ENVIRONMENTS",
      description:
        "Immersive worlds, virtual environments and digital landscapes.",
      icon: "⌁",
    },
    {
      number: "07",
      title: "COMPOSITING",
      description:
        "Combining visual elements into seamless cinematic shots.",
      icon: "▢",
    },
    {
      number: "08",
      title: "PRODUCT VISUALIZATION",
      description:
        "High-quality CGI visuals for products, brands and advertising.",
      icon: "⬡",
    },
    {
      number: "09",
      title: "CREATIVE DIRECTION",
      description:
        "Concept development, visual storytelling and artistic direction.",
      icon: "▤",
    },
    {
      number: "10",
      title: "POST PRODUCTION",
      description:
        "Editing, colour grading, finishing and final delivery.",
      icon: "☷",
    },
  ];

  const selected = rings[selectedRing];

  const ringPositions = [
    { x: 50, y: 8 },
    { x: 75, y: 17 },
    { x: 88, y: 39 },
    { x: 84, y: 65 },
    { x: 69, y: 84 },
    { x: 50, y: 92 },
    { x: 31, y: 84 },
    { x: 16, y: 65 },
    { x: 12, y: 39 },
    { x: 25, y: 17 },
  ];

  return (
      <section
      hidden={isHidden}
      className={`section-04 ${introPlaying ? "section-04-intro-playing" : ""} ${isTransitionReady || introPlaying ? "section-transition-active" : "section-transition-waiting"}`}
      id="section-04"
    >

      {/* Section 04 looping background */}
      <video
        ref={section04BackgroundRef}
        className="section-04-background"
        muted
        loop
        playsInline
        preload="none"
        src="/videos/section4-background.optimized.mp4"
        aria-hidden="true"
        onCanPlay={onBackgroundReady}
        onError={onBackgroundReady}
      />

      <div className="section-04-overlay" />

      <img
        className="section-04-shangchi-logo-overlay"
        src="/images/shang-chi-logo-overlay.png"
        alt="Shang-Chi and the Legend of the Ten Rings"
      />

      {/* Two-second Ten Rings intro */}
      {introPlaying && (
        <div className={`section-04-intro ${introFading ? "is-fading" : ""}`}>
          <video
            ref={introVideoRef}
            className="section-04-intro-video"
            src="/videos/section4-intro.mp4"
          preload="metadata"
            playsInline
            onEnded={finishSection04Intro}
            onError={finishSection04Intro}
          />
          {needsSoundGesture && (
            <button type="button" className="section-04-intro-sound-start" onClick={() => void playSection04IntroWithSound()}>
              ▶ PLAY INTRO WITH SOUND
            </button>
          )}
          <button type="button" className="section-04-skip-intro" onClick={skipSection04Intro}>SKIP INTRO</button>
        </div>
      )}

      {/* Top branding */}
      <div className="section-04-topbar">
        <div className="section-04-brand-card">
          <img
            className="section-04-dragon-overlay"
            src="/videos/goat-vfx-dragon-overlay.webp"
            alt=""
            aria-hidden="true"
            loading="lazy"
            decoding="async"
            draggable={false}
          />
          <div className="section-04-logo">
            THE GOAT <span>VFX</span>
          </div>
        </div>
      </div>

      {/* Main three-column layout */}
      <div className="section-04-layout">

        {/* LEFT: Introduction */}
        <aside className="section-04-left">
          <div className="section-04-eyebrow-spacer" aria-hidden="true" />

          <h1>
            THE
            <br />
            TEN RINGS
          </h1>

          <div className="section-04-red-underline" />

          <h2>
            TEN CREATIVE FORCES.
            <br />
            ONE VISUAL UNIVERSE.
          </h2>

          <p className="section-04-intro-copy">
            A complete visual production ecosystem that transforms
            ideas into cinematic experiences.
          </p>
        </aside>

        {/* CENTRE: Ten interactive rings */}
        <div className="section-04-ring-stage">

          <div className="section-04-central-portal">
            <div className="section-04-portal-inner">
              <div className="section-04-central-logo">
                <img src="/images/logo-overlay.png" alt="The Goat VFX" />
              </div>
              <p>CREATIVE</p>
              <p>PRODUCTION PIPELINE</p>
            </div>
          </div>

          {rings.map((ring, index) => (
            <button
              key={ring.number}
              ref={(node) => {
      ringRefs.current[index] = node;
    }}
              type="button"
              className={`section-04-ring ${
                selectedRing === index ? "active" : ""
              }`}
              style={{
                left: `${ringPositions[index].x}%`,
                top: `${ringPositions[index].y}%`,
              }}
              onClick={() => handleRingSelect(index)}
              aria-label={`Select ${ring.title}`}
              aria-pressed={selectedRing === index}
            >
              <span className="section-04-ring-inner">
                <span className="section-04-ring-icon">
                  {ring.icon}
                </span>
                <span className="section-04-ring-number">
                  {ring.number}
                </span>
                <span className="section-04-ring-title">
                  {ring.title}
                </span>
              </span>
            </button>
          ))}
        </div>

        {/* RIGHT: Selected capability */}
        <aside className="section-04-right">
          <div
  className="section-04-detail-panel"
  ref={detailPanelRef}
>

            <div className="section-04-detail-number">
              <span>{selected.icon}</span>
              <strong>{selected.number}</strong>
            </div>

            <h2>{selected.title}</h2>

            <div className="section-04-red-underline" />

            <p>{selected.description}</p>

            
{/* Dynamic Energy Reactor */}
<div
  className={`section-04-preview s4-reactor s4-reactor-${selectedRing + 1}`}
  key={selectedRing}
>
  <div className="s4-reactor-header">
    <span>GOAT VFX / ENERGY SYSTEM</span>
    <span className="s4-reactor-live">
      <i /> LIVE
    </span>
  </div>

  <div className="s4-reactor-visual">
    <div className="s4-reactor-glow" />

    <svg
      className="s4-reactor-svg"
      viewBox="0 0 400 240"
      role="img"
      aria-label={`${selected.title} energy visualization`}
    >
      <defs>
        <radialGradient id="s4CoreGradient">
          <stop offset="0%" stopColor="#fff7d5" />
          <stop offset="35%" stopColor="#ffc45c" />
          <stop offset="75%" stopColor="#a95016" />
          <stop offset="100%" stopColor="#281006" />
        </radialGradient>

        <filter id="s4ReactorGlow">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Reactor outer orbit */}
      <circle cx="200" cy="120" r="88"
        className="s4-orbit s4-orbit-one" />
      <circle cx="200" cy="120" r="69"
        className="s4-orbit s4-orbit-two" />
      <ellipse cx="200" cy="120" rx="112" ry="39"
        className="s4-orbit s4-orbit-three" />

      {/* Dynamic geometry: changes for each capability */}
      <g className="s4-reactor-geometry">

        {selectedRing === 0 && (
          <>
            {Array.from({ length: 20 }, (_, i) => (
              <circle
                key={i}
                cx={200 + Math.cos(i * 0.314) * (35 + (i % 4) * 14)}
                cy={120 + Math.sin(i * 0.314) * (35 + (i % 4) * 14)}
                r={2 + (i % 3)}
                className="s4-particle"
                style={{ animationDelay: `${i * 0.07}s` }}
              />
            ))}
            <path
              d="M200 35 L207 102 L265 120 L207 138 L200 205 L193 138 L135 120 L193 102 Z"
              className="s4-energy-shape"
            />
          </>
        )}

        {selectedRing === 1 && (
          <g className="s4-wire-cube">
            <path d="M200 52 L260 86 L260 154 L200 188 L140 154 L140 86 Z" />
            <path d="M200 52 L200 120 L260 154 M200 120 L140 154 M200 120 L200 188 M140 86 L200 120 L260 86" />
          </g>
        )}

        {selectedRing === 2 && (
          <>
            <ellipse cx="200" cy="120" rx="94" ry="35"
              className="s4-orbit s4-orbit-three" />
            <ellipse cx="200" cy="120" rx="94" ry="35"
              className="s4-orbit s4-orbit-four"
              transform="rotate(60 200 120)" />
            <circle cx="200" cy="26" r="7" className="s4-node" />
            <circle cx="281" cy="167" r="7" className="s4-node" />
            <circle cx="119" cy="167" r="7" className="s4-node" />
          </>
        )}

        {selectedRing === 3 && (
          <>
            {Array.from({ length: 7 }, (_, i) => (
              <path
                key={i}
                d={`M${95 + i * 20} 45 Q${200} ${15 + i * 15} ${305 - i * 20} 195`}
                className="s4-motion-line"
                style={{ animationDelay: `${i * 0.12}s` }}
              />
            ))}
          </>
        )}

        {selectedRing === 4 && (
          <>
            {Array.from({ length: 12 }, (_, i) => (
              <g key={i} className="s4-neural-node">
                <circle
                  cx={200 + Math.cos(i * Math.PI / 6) * 82}
                  cy={120 + Math.sin(i * Math.PI / 6) * 62}
                  r="5"
                />
                <line
                  x1="200"
                  y1="120"
                  x2={200 + Math.cos(i * Math.PI / 6) * 82}
                  y2={120 + Math.sin(i * Math.PI / 6) * 62}
                />
              </g>
            ))}
          </>
        )}

        {selectedRing === 5 && (
          <>
            {Array.from({ length: 6 }, (_, i) => (
              <path
                key={i}
                d={`M${95 + i * 42} 45 L${95 + i * 42} 195`}
                className="s4-environment-line"
              />
            ))}
            <path d="M95 85 L305 85 M95 120 L305 120 M95 155 L305 155"
              className="s4-environment-line" />
          </>
        )}

        {selectedRing === 6 && (
          <>
            <path d="M105 65 L295 65 L245 175 L155 175 Z"
              className="s4-composite-plane" />
            <path d="M130 85 L270 85 L235 155 L165 155 Z"
              className="s4-composite-plane second" />
            <path d="M200 45 L200 195 M90 120 L310 120"
              className="s4-motion-line" />
          </>
        )}

        {selectedRing === 7 && (
          <g className="s4-product-object">
            <path d="M160 83 L200 60 L240 83 L240 157 L200 180 L160 157 Z" />
            <path d="M160 83 L200 107 L240 83 M200 107 L200 180" />
          </g>
        )}

        {selectedRing === 8 && (
          <>
            <circle cx="200" cy="120" r="55" className="s4-direction-ring" />
            <circle cx="200" cy="120" r="35" className="s4-direction-ring inner" />
            <path d="M200 45 L200 195 M125 120 L275 120 M147 67 L253 173 M253 67 L147 173"
              className="s4-motion-line" />
          </>
        )}

        {selectedRing === 9 && (
          <>
            {Array.from({ length: 5 }, (_, i) => (
              <path
                key={i}
                d={`M${110 + i * 15} ${75 + i * 12} H${290 - i * 15}`}
                className="s4-timeline-track"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
            <path d="M110 165 H290" className="s4-motion-line" />
          </>
        )}
      </g>

      {/* Central energy core */}
      <circle
        cx="200"
        cy="120"
        r="24"
        fill="url(#s4CoreGradient)"
        filter="url(#s4ReactorGlow)"
        className="s4-reactor-core"
      />
      <circle cx="200" cy="120" r="9" fill="#fff8df" />
    </svg>

    <div className="s4-reactor-scanline" />
  </div>

  <div className="s4-reactor-footer">
    <div>
      <small>ACTIVE SYSTEM</small>
      <strong>{selected.number} / {selected.title}</strong>
    </div>

    <div className="s4-reactor-status">
      <span />
      SYSTEM ACTIVE
    </div>
  </div>
</div>

<div className="section-04-detail-counter">
  CAPABILITY <span>{selected.number}</span> / 10
</div>
</div>
</aside>
</div>



      {/* Bottom ring selectors */}
      <div className="section-04-bottom">

        <button
          type="button"
          className="section-04-back"
          onClick={onBack}
        >
          <span>←</span> BACK
        </button>

        <button
          type="button"
          className="section-04-next"
          onClick={onNext}
        >
          NEXT <span>→</span>
        </button>
      </div>
    </section>
  );
}



// ============================================
// SECTION 05 — PROCEDURAL 3D UNIVERSE DIORAMAS
// Requires: npm install three
// ============================================
function Section05UniverseScene({ labelElements, onSelectUniverse }: { labelElements: React.RefObject<Array<HTMLDivElement | null>>; onSelectUniverse: (index: number) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: window.matchMedia("(max-width: 760px)").matches ? "low-power" : "high-performance",
    });
    const pixelRatioLimit = window.matchMedia("(max-width: 760px)").matches ? 1.15 : 1.5;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, pixelRatioLimit));
    renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.55;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x06251a, 0.012);

    const camera = new THREE.PerspectiveCamera(
      36,
      canvas.clientWidth / Math.max(canvas.clientHeight, 1),
      0.1,
      100
    );
    camera.position.set(0, 0.2, 13.8);

    scene.add(new THREE.AmbientLight(0xd5ffe8, 4.2));
    const keyLight = new THREE.DirectionalLight(0xf1fff7, 5.0);
    keyLight.position.set(-4, 7, 8);
    scene.add(keyLight);
    const emeraldLight = new THREE.PointLight(0x20ff9a, 58, 28);
    emeraldLight.position.set(0, 0, 5);
    scene.add(emeraldLight);

    const universeGroups: THREE.Group[] = [];
    const animated: Array<{ mesh: THREE.Object3D; speed: number; axis: "x" | "y" | "z"; phase: number }> = [];
    const disposables: THREE.Object3D[] = [];

    const mat = (color: number, metalness = 0.25, roughness = 0.48) =>
      new THREE.MeshStandardMaterial({ color, metalness, roughness, emissive: color, emissiveIntensity: 0.32 });

    const addMesh = (parent: THREE.Object3D, geometry: THREE.BufferGeometry, material: THREE.Material, x: number, y: number, z: number) => {
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(x, y, z);
      parent.add(mesh);
      return mesh;
    };

    const makeBase = (group: THREE.Group, accent: number) => {
      const dark = new THREE.MeshStandardMaterial({ color: 0x252b32, metalness: 0.82, roughness: 0.26, emissive: 0x111820, emissiveIntensity: 0.20 });
      const rim = new THREE.MeshStandardMaterial({ color: accent, emissive: accent, emissiveIntensity: 0.8, metalness: 0.7, roughness: 0.25 });
      addMesh(group, new THREE.CylinderGeometry(1.18, 0.92, 0.22, 48, 1), dark, 0, -0.62, 0);
      const ring = addMesh(group, new THREE.TorusGeometry(1.08, 0.025, 8, 72), rim, 0, -0.48, 0);
      ring.rotation.x = Math.PI / 2.7;
      animated.push({ mesh: ring, speed: 0.22, axis: "y", phase: Math.random() * 6 });
      // rocky underside gives each world a floating diorama silhouette
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * Math.PI * 2;
        const rock = addMesh(group, new THREE.DodecahedronGeometry(0.18 + (i % 3) * 0.045, 0), dark,
          Math.cos(a) * (0.68 + (i % 2) * 0.12), -0.78 - (i % 3) * 0.09, Math.sin(a) * (0.68 + (i % 2) * 0.12));
        rock.rotation.set(i * 0.4, i * 0.7, i * 0.2);
      }
    };

    const addParticles = (group: THREE.Group, color: number, count = 70, spread = 2.1) => {
      const positions = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        positions[i * 3] = (Math.random() - 0.5) * spread * 2;
        positions[i * 3 + 1] = (Math.random() - 0.15) * spread;
        positions[i * 3 + 2] = (Math.random() - 0.5) * spread;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      const points = new THREE.Points(geo, new THREE.PointsMaterial({
        color, size: 0.026, transparent: true, opacity: 0.78,
        blending: THREE.AdditiveBlending, depthWrite: false
      }));
      group.add(points);
      animated.push({ mesh: points, speed: 0.12, axis: "y", phase: Math.random() * 6 });
    };

    const addUniverseGlitterHalo = (group: THREE.Group, color: number) => {
      const count = 92;
      const positions = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const radius = 1.18 + Math.random() * 0.18;
        positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = radius * Math.cos(phi) * 0.82;
        positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      const material = new THREE.PointsMaterial({
        color,
        size: 0.045,
        transparent: true,
        opacity: 0.88,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true,
      });
      const glitter = new THREE.Points(geometry, material);
      group.add(glitter);
      animated.push({ mesh: glitter, speed: 0.16, axis: "y", phase: Math.random() * 6 });
    };

    const createWorld = (kind: string, accent: number) => {
      const group = new THREE.Group();
      makeBase(group, accent);
      const accentMat = new THREE.MeshStandardMaterial({ color: 0x89939b, metalness: 0.84, roughness: 0.20, emissive: accent, emissiveIntensity: 0.30 });
      const brightMat = new THREE.MeshStandardMaterial({
        color: 0xd1d8dc, emissive: accent, emissiveIntensity: 0.62,
        metalness: 0.35, roughness: 0.22
      });
      const stone = new THREE.MeshStandardMaterial({ color: 0x46515a, metalness: 0.76, roughness: 0.30, emissive: 0x171d24, emissiveIntensity: 0.16 });

      if (kind === "vfx") {
        // A destroyed miniature city under a rising explosion plume.
        for (let i = 0; i < 8; i++) {
          const h = 0.35 + (i % 4) * 0.19;
          const b = addMesh(group, new THREE.BoxGeometry(0.22, h, 0.22), stone,
            Math.cos(i * 0.8) * (0.35 + (i % 2) * 0.35), -0.38 + h / 2, Math.sin(i * 0.8) * 0.48);
          b.rotation.y = i * 0.3;
        }
        const blast = addMesh(group, new THREE.IcosahedronGeometry(0.42, 2), brightMat, 0, 0.18, 0);
        blast.scale.set(0.8, 1.35, 0.8);
        animated.push({ mesh: blast, speed: 0.35, axis: "y", phase: 0 });
        for (let i = 0; i < 12; i++) {
          const shard = addMesh(group, new THREE.TetrahedronGeometry(0.12 + (i % 3) * 0.035), accentMat,
            Math.sin(i * 2.1) * (0.35 + (i % 3) * 0.12), 0.12 + (i % 4) * 0.18, Math.cos(i * 1.7) * 0.4);
          shard.rotation.set(i, i * 0.6, i * 0.3);
          animated.push({ mesh: shard, speed: 0.5 + i * 0.015, axis: "z", phase: i });
        }
        addParticles(group, 0xffc17a, 62, 1.45);
      }

      if (kind === "cgi") {
        // A detailed miniature architectural skyline.
        for (let i = 0; i < 13; i++) {
          const x = Math.cos(i * 2.4) * (0.3 + (i % 3) * 0.2);
          const z = Math.sin(i * 2.4) * (0.3 + (i % 3) * 0.2);
          const h = 0.38 + ((i * 7) % 8) * 0.12;
          const tower = addMesh(group, new THREE.BoxGeometry(0.16 + (i % 3) * 0.035, h, 0.16 + (i % 2) * 0.04), stone, x, -0.43 + h / 2, z);
          tower.rotation.y = i * 0.17;
          const cap = addMesh(group, new THREE.BoxGeometry(0.19, 0.035, 0.19), brightMat, x, -0.43 + h + 0.02, z);
          cap.rotation.y = tower.rotation.y;
        }
        const grid = addMesh(group, new THREE.TorusGeometry(0.82, 0.012, 6, 64), brightMat, 0, -0.34, 0);
        grid.rotation.x = Math.PI / 2;
        addParticles(group, 0x9be9dc, 42, 1.5);
      }

      if (kind === "animation") {
        // Fantasy castle, towers and floating storybook crystals.
        addMesh(group, new THREE.BoxGeometry(0.65, 0.65, 0.48), stone, 0, -0.08, 0);
        for (let i = 0; i < 4; i++) {
          const x = (i % 2 ? 1 : -1) * (0.35 + (i > 1 ? 0.12 : 0));
          const z = (i < 2 ? -1 : 1) * 0.25;
          addMesh(group, new THREE.CylinderGeometry(0.09, 0.13, 0.7, 8), accentMat, x, 0.28, z);
          const roof = addMesh(group, new THREE.ConeGeometry(0.17, 0.28, 8), brightMat, x, 0.77, z);
          animated.push({ mesh: roof, speed: 0.18, axis: "y", phase: i });
        }
        for (let i = 0; i < 5; i++) {
          const crystal = addMesh(group, new THREE.OctahedronGeometry(0.13), brightMat,
            Math.sin(i * 1.4) * 0.95, 0.35 + (i % 2) * 0.3, Math.cos(i * 1.4) * 0.8);
          animated.push({ mesh: crystal, speed: 0.55, axis: "y", phase: i });
        }
        addParticles(group, 0xc6a8df, 42, 1.55);
      }

      if (kind === "motion") {
        // Abstract motion-design sculpture: rings, arcs and floating geometry.
        for (let i = 0; i < 4; i++) {
          const torus = addMesh(group, new THREE.TorusGeometry(0.42 + i * 0.16, 0.025, 8, 64), i % 2 ? brightMat : accentMat, 0, 0.1 + i * 0.06, 0);
          torus.rotation.set(i * 0.55, i * 0.7, i * 0.4);
          animated.push({ mesh: torus, speed: 0.24 + i * 0.08, axis: i % 2 ? "x" : "y", phase: i });
        }
        for (let i = 0; i < 8; i++) {
          const cube = addMesh(group, new THREE.BoxGeometry(0.15, 0.15, 0.15), brightMat,
            Math.sin(i * 1.1) * 0.82, Math.cos(i * 1.7) * 0.6, Math.cos(i * 1.1) * 0.7);
          animated.push({ mesh: cube, speed: 0.5, axis: "z", phase: i });
        }
        addParticles(group, 0x9be8c9, 42, 1.4);
      }

      if (kind === "compositing") {
        // Layered transparent planes and a dimensional portal.
        const glass = new THREE.MeshPhysicalMaterial({
          color: accent, emissive: accent, emissiveIntensity: 0.62,
          metalness: 0.15, roughness: 0.08, transmission: 0.25,
          transparent: true, opacity: 0.72, thickness: 0.2
        });
        for (let i = 0; i < 4; i++) {
          const plane = addMesh(group, new THREE.PlaneGeometry(0.95, 1.05), glass,
            (i - 1.5) * 0.2, 0.08, (i - 1.5) * -0.12);
          plane.rotation.y = (i - 1.5) * 0.18;
          animated.push({ mesh: plane, speed: 0.16, axis: "y", phase: i });
        }
        const portal = addMesh(group, new THREE.TorusGeometry(0.52, 0.055, 12, 64), brightMat, 0, 0.15, 0.35);
        portal.scale.y = 1.28;
        animated.push({ mesh: portal, speed: 0.2, axis: "z", phase: 0 });
        addParticles(group, 0xd9a9c8, 38, 1.4);
      }

      if (kind === "post") {
        // Film reel, film-strip ribbon and a miniature grading console.
        const reelMat = brightMat;
        const reel = addMesh(group, new THREE.TorusGeometry(0.36, 0.075, 10, 48), reelMat, -0.35, 0.22, 0);
        animated.push({ mesh: reel, speed: 0.4, axis: "z", phase: 0 });
        addMesh(group, new THREE.CylinderGeometry(0.12, 0.12, 0.08, 24), stone, -0.35, 0.22, 0);
        const strip = addMesh(group, new THREE.BoxGeometry(1.1, 0.08, 0.08), accentMat, 0.35, 0.15, 0);
        strip.rotation.z = -0.3;
        for (let i = 0; i < 5; i++) {
          const frame = addMesh(group, new THREE.BoxGeometry(0.14, 0.16, 0.035), brightMat, 0.0 + i * 0.17, 0.32 + i * 0.02, 0.12);
          frame.rotation.z = -0.3;
        }
        const screen = addMesh(group, new THREE.BoxGeometry(0.62, 0.34, 0.08), stone, 0.2, -0.18, 0.25);
        screen.rotation.z = -0.12;
        addParticles(group, 0xe6cf9a, 38, 1.35);
      }

      const glassShell = new THREE.Mesh(
        new THREE.SphereGeometry(1.34, 48, 36),
        new THREE.MeshPhysicalMaterial({
          color: 0xe2e8ed,
          metalness: 0.10,
          roughness: 0.10,
          transmission: 0.72,
          thickness: 0.62,
          ior: 1.36,
          clearcoat: 1,
          clearcoatRoughness: 0.06,
          transparent: true,
          opacity: 0.34,
          side: THREE.DoubleSide,
          attenuationColor: new THREE.Color(accent),
          attenuationDistance: 2.4,
          emissive: new THREE.Color(accent),
          emissiveIntensity: 0.045,
          depthWrite: false,
        })
      );
      glassShell.position.set(0, 0.02, 0);
      glassShell.renderOrder = 3;
      group.add(glassShell);

      // Fine coloured glitter stays local to this universe, never shared as one green effect.
      addUniverseGlitterHalo(group, accent);

      group.userData.baseY = 0;
      scene.add(group);
      universeGroups.push(group);
      disposables.push(group);
      return group;
    };

    const worldSpecs = [
      // Six worlds orbit the centre at equal 60-degree intervals.
      { kind: "vfx", color: 0xc18a55, pos: [0, 2.65, 0] },
      { kind: "cgi", color: 0x91b8c8, pos: [2.42, 1.65, 0] },
      { kind: "animation", color: 0x9b86b8, pos: [2.42, -1.65, 0] },
      // Lift the bottom world slightly to leave room for its title beneath it.
      { kind: "motion", color: 0x78b6a5, pos: [0, -2.2, 0] },
      { kind: "compositing", color: 0xb78398, pos: [-2.42, -1.65, 0] },
      { kind: "post", color: 0xc7ad78, pos: [-2.42, 1.65, 0] },
    ];

    worldSpecs.forEach((spec, index) => {
      const group = createWorld(spec.kind, spec.color);
      group.position.set(spec.pos[0], spec.pos[1], spec.pos[2]);
      group.scale.setScalar(0.74);
      group.rotation.y = (index % 2 ? 0.18 : -0.18);
      group.userData.baseY = spec.pos[1];
      group.userData.universeIndex = index;
    });

    // Fine star field behind the dioramas.
    const starPositions = new Float32Array(420 * 3);
    for (let i = 0; i < 420; i++) {
      starPositions[i * 3] = (Math.random() - 0.5) * 13;
      starPositions[i * 3 + 1] = (Math.random() - 0.5) * 8;
      starPositions[i * 3 + 2] = -2 - Math.random() * 3;
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
    const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({
      color: 0xd5ddd8, size: 0.014, transparent: true, opacity: 0.28,
      blending: THREE.AdditiveBlending, depthWrite: false
    }));
    scene.add(stars);

    let frame = 0;
    let canvasVisible = canvas.getClientRects().length > 0 && document.visibilityState !== "hidden";
    const clock = new THREE.Clock();
    const projectedPosition = new THREE.Vector3();
    const worldPosition = new THREE.Vector3();
    const animate = () => {
      frame = 0;
      if (!canvasVisible) return;
      const t = clock.getElapsedTime();
      const placedLabels: Array<{ left: number; top: number; right: number; bottom: number }> = [];
      universeGroups.forEach((group, i) => {
        group.position.y = group.userData.baseY + Math.sin(t * 0.8 + i) * 0.08;
        group.rotation.y += 0.0009 * (i % 2 ? 1 : -1);

        const label = labelElements.current[i];
        if (!label || label.dataset.positioned === "true") return;

        group.getWorldPosition(worldPosition);
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        const labelWidth = label.offsetWidth;
        const labelHeight = label.offsetHeight;
        projectedPosition.copy(worldPosition).project(camera);
        projectedPosition.copy(worldPosition);
        projectedPosition.y -= 1.28;
        projectedPosition.project(camera);
        const bottomY = ((1 - projectedPosition.y) / 2) * height;
        const centerX = ((projectedPosition.x + 1) / 2) * width;
        let x = centerX - labelWidth / 2;
        let y = bottomY + 10;
        if (i === 0) y -= 16;
        if (i === 1 || i === 5) y -= 14;
        x = Math.max(4, Math.min(width - labelWidth - 4, x));
        y = Math.max(4, Math.min(height - labelHeight - 4, y));

        // If two captions still touch at a narrow viewport, keep both centered
        // beneath their own planets and move the later caption down a little.
        for (let attempt = 0; attempt < 6; attempt++) {
          const collision = placedLabels.find((placed) =>
            x < placed.right + 5 && x + labelWidth > placed.left - 5 &&
            y < placed.bottom + 5 && y + labelHeight > placed.top - 5
          );
          if (!collision) break;
          y = Math.min(height - labelHeight - 4, collision.bottom + 6);
        }
        placedLabels.push({ left: x, top: y, right: x + labelWidth, bottom: y + labelHeight });
        label.style.setProperty("--label-left", `${x}px`);
        label.style.setProperty("--label-top", `${y}px`);
        label.dataset.positioned = "true";
      });
      animated.forEach((item) => {
        const value = Math.sin(t * item.speed + item.phase) * 0.012;
        item.mesh.rotation[item.axis] += value;
      });
      stars.rotation.y = Math.sin(t * 0.025) * 0.035;
      renderer.render(scene, camera);
      frame = requestAnimationFrame(animate);
    };

    const updateCanvasVisibility = (visible: boolean) => {
      if (canvasVisible === visible) return;
      canvasVisible = visible;
      if (visible) {
        if (!frame) frame = requestAnimationFrame(animate);
      } else if (frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
    };

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const getUniverseAtPointer = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return -1;

      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);

      // First use precise mesh intersections.
      const hits = raycaster.intersectObjects(universeGroups, true);
      if (hits.length) {
        let target: THREE.Object3D | null = hits[0].object;
        while (target && target.userData.universeIndex === undefined) {
          target = target.parent;
        }
        if (target && typeof target.userData.universeIndex === "number") {
          return target.userData.universeIndex as number;
        }
      }

      // Fallback: test the ray against each visible glass sphere's centre.
      // This keeps selection reliable even when transparent glass surfaces
      // or internal decorative meshes affect the raycast result.
      const center = new THREE.Vector3();
      let nearestIndex = -1;
      let nearestDistance = Infinity;
      universeGroups.forEach((group, index) => {
        group.getWorldPosition(center);
        const distance = raycaster.ray.distanceToPoint(center);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = index;
        }
      });
      return nearestDistance < 1.15 ? nearestIndex : -1;
    };

    const handleCanvasClick = (event: MouseEvent) => {
      const index = getUniverseAtPointer(event);
      if (index >= 0) onSelectUniverse(index);
    };

    const handlePointerMove = (event: MouseEvent) => {
      canvas.style.cursor = getUniverseAtPointer(event) >= 0 ? "pointer" : "default";
    };

    canvas.style.pointerEvents = "auto";
    canvas.style.cursor = "default";
    canvas.addEventListener("click", handleCanvasClick);
    canvas.addEventListener("mousemove", handlePointerMove);

    const resize = () => {
      const width = canvas.clientWidth || 1;
      const height = canvas.clientHeight || 1;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      labelElements.current.forEach((label) => {
        if (label) delete label.dataset.positioned;
      });
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      updateCanvasVisibility(Boolean(entry?.isIntersecting) && document.visibilityState !== "hidden");
    });
    visibilityObserver.observe(canvas);
    const handleDocumentVisibility = () => {
      updateCanvasVisibility(canvas.getClientRects().length > 0 && document.visibilityState !== "hidden");
    };
    document.addEventListener("visibilitychange", handleDocumentVisibility);
    if (canvasVisible) frame = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      visibilityObserver.disconnect();
      document.removeEventListener("visibilitychange", handleDocumentVisibility);
      canvas.removeEventListener("click", handleCanvasClick);
      canvas.removeEventListener("mousemove", handlePointerMove);
      scene.traverse((object) => {
        const mesh = object as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        if (mesh.material) {
          const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          materials.forEach((material) => material.dispose());
        }
      });
      renderer.dispose();
    };
  }, [onSelectUniverse]);

  return (
    <canvas
      ref={canvasRef}
      className="section-05-three-canvas"
      aria-label="Select one of the six creative universes"
      style={{ pointerEvents: "auto", cursor: "default", touchAction: "manipulation" }}
    />
  );
}

// ============================================
// SECTION 05 — THE SIX UNIVERSES
// ============================================
function Section05({ onBack, onNext, animationsEnabled, isHidden = false }: { onBack: () => void; onNext: () => void; animationsEnabled: boolean; isHidden?: boolean }) {
  const [introFinished, setIntroFinished] = useState(!animationsEnabled);
  const [introFading, setIntroFading] = useState(false);
  const [selectedUniverse, setSelectedUniverse] = useState<number | null>(null);
  const introRef = useRef<HTMLVideoElement>(null);
  const backgroundRef = useRef<HTMLVideoElement>(null);
  const labelElements = useRef<Array<HTMLDivElement | null>>([]);
  const finishTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finishStartedRef = useRef(false);

  const universes = [
    { number: "01", title: "VFX", subtitle: "VISUAL EFFECTS", className: "vfx", image: "/images/universe-vfx.webp" },
    { number: "02", title: "CGI", subtitle: "3D & CGI", className: "cgi", image: "/images/universe-cgi.webp" },
    { number: "03", title: "ANIMATION", subtitle: "3D ANIMATION", className: "animation", image: "/images/universe-animation.webp" },
    { number: "04", title: "MOTION GRAPHICS", subtitle: "MOTION DESIGN", className: "motion", image: "/images/universe-motion-graphics.webp" },
    { number: "05", title: "COMPOSITING", subtitle: "VISUAL INTEGRATION", className: "compositing", image: "/images/universe-compositing.webp" },
    { number: "06", title: "POST PRODUCTION", subtitle: "EDITING & FINISHING", className: "post", image: "/images/universe-post-production.webp" },
  ];

  useEffect(() => {
    const background = backgroundRef.current;
    if (!animationsEnabled) {
      // Motion preference changes can skip an in-progress intro.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIntroFinished(true);
      introRef.current?.pause();
    }
    if (background) {
      background.muted = true;
      background.loop = true;
      if (isHidden || !introFinished) {
        background.pause();
      } else {
        activateVideo(background);
        void background.play().catch((error) => {
          console.warn("Section 05 background playback failed:", error);
        });
      }
    }

    const intro = introRef.current;
    if (isHidden) {
      intro?.pause();
      return () => {
        if (finishTimerRef.current) clearTimeout(finishTimerRef.current);
        background?.pause();
      };
    }
    if (!animationsEnabled) {
      // Motion preference changes can skip an in-progress intro.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIntroFinished(true);
      intro?.pause();
      return () => {
        if (finishTimerRef.current) clearTimeout(finishTimerRef.current);
        background?.pause();
      };
    }
    if (intro) {
      activateVideo(intro);
      intro.muted = false;
      intro.defaultMuted = false;
      intro.volume = 1;
      const playPromise = intro.play();
      if (playPromise) {
        void playPromise.catch((error) => {
          if (error instanceof Error && error.name === "AbortError") return;
          console.warn("Section 05 intro playback could not start:", error);
        });
      }
    }

    return () => {
      if (finishTimerRef.current) clearTimeout(finishTimerRef.current);
      background?.pause();
      intro?.pause();
    };
  }, [animationsEnabled, introFinished, isHidden]);

  const finishIntro = () => {
    if (finishStartedRef.current) return;
    finishStartedRef.current = true;
    setIntroFading(true);
    finishTimerRef.current = setTimeout(() => setIntroFinished(true), 50);
  };

  const skipSection05Intro = () => {
    finishStartedRef.current = true;
    if (finishTimerRef.current) clearTimeout(finishTimerRef.current);
    introRef.current?.pause();
    setIntroFading(false);
    setIntroFinished(true);
  };

  return (
    <section hidden={isHidden} className={`section-05 ${introFinished ? "section-05-ready" : "section-05-intro-state"} ${selectedUniverse !== null ? "has-selected-universe" : ""}`} id="section-05">
      <video
        ref={backgroundRef}
        className="section-05-background"
        src="/videos/section5-background.720p.mp4"
        muted
        loop
        playsInline
        preload="none"
        aria-hidden="true"
      />
      <div className="section-05-atmosphere" />
      <img
        className="section-05-loki-logo-overlay"
        src="/images/loki-logo-overlay.png"
        alt="Loki"
      />

      {selectedUniverse !== null && (
        <div
          className="section-05-detail-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={`${universes[selectedUniverse].title} universe`}
          style={{
            position: "absolute",
            top: "clamp(76px, 11vh, 112px)",
            right: "clamp(16px, 5vw, 72px)",
            bottom: "clamp(54px, 7vh, 78px)",
            left: "clamp(16px, 5vw, 72px)",
            zIndex: 50,
            display: "block",
            overflow: "hidden",
            background: "transparent",
            isolation: "isolate",
          }}
        >
          <img
            src={universes[selectedUniverse].image}
            alt={`${universes[selectedUniverse].title} cinematic environment`}
            loading="lazy"
            decoding="async"
            style={{
              position: "absolute",
              inset: 0,
              display: "block",
              width: "100%",
              height: "100%",
              objectFit: "contain",
              objectPosition: "center",
              filter: "brightness(1)",
              opacity: 1,
              transform: "none",
            }}
          />
          <button
            type="button"
            onClick={() => setSelectedUniverse(null)}
            aria-label="Back to six universes"
            style={{
              position: "absolute",
              zIndex: 3,
              top: "18px",
              right: "20px",
              padding: "8px 13px",
              border: "1px solid rgba(255,255,255,.65)",
              borderRadius: "999px",
              background: "rgba(0,0,0,.32)",
              color: "#fff",
              fontSize: "10px",
              lineHeight: 1,
              letterSpacing: ".1em",
              cursor: "pointer",
              backdropFilter: "blur(8px)",
            }}
          >
            ← BACK
          </button>
        </div>
      )}

      {!introFinished && (
        <div className={`section-05-intro-layer ${introFading ? "is-fading" : ""}`}>
          <video
            ref={introRef}
            className="section-05-intro-video"
            src="/videos/section5-intro.720p.mp4"
            playsInline
            preload="none"
            onEnded={finishIntro}
            onError={() => {
              console.error("Could not load /videos/section5-intro.mp4");
              finishIntro();
            }}
          />
          <button type="button" className="section-05-skip-intro" onClick={skipSection05Intro}>SKIP INTRO</button>
        </div>
      )}

      <div className={`section-05-interface ${introFinished ? "is-ready" : ""}`} aria-hidden={!introFinished}>
          <header className="section-05-topbar">
            <div className="section-05-brand-card">
              <img
                className="section-05-energy-rope"
                src="/videos/section-05-emerald-energy-rope.webp"
                alt=""
                aria-hidden="true"
                loading="lazy"
                decoding="async"
              />
              <div className="section-05-wordmark">THE GOAT <span>VFX</span></div>
            </div>
            
          </header>

          <div className="section-05-content">
            <div className="section-05-copy">
              <p className="section-05-eyebrow"><span /> THE GOAT VFX PRESENTS</p>
              <div className="section-05-title-wrap">
                <h1>ENTER THE<br /><span>SIX UNIVERSES</span></h1>
              </div>
              <p className="section-05-tagline">BEYOND REALITY. BEYOND IMAGINATION.</p>
              <p className="section-05-description">
                Six dimensions. Six creative powers. One vision. Explore the creative worlds behind our visual effects and cinematic production.
              </p>
              <div className="section-05-hint"><span className="section-05-hint-dot" /> SIX CREATIVE DIMENSIONS AWAIT</div>
            </div>

            <div className="section-05-universe-field" aria-label="Six miniature 3D creative universes">
              <Section05UniverseScene labelElements={labelElements} onSelectUniverse={setSelectedUniverse} />
              {universes.map((universe, index) => (
                <div className={`section-05-universe section-05-universe-${universe.className}`} key={universe.number}>
                  <div
                    ref={(element) => { labelElements.current[index] = element; }}
                    className="section-05-universe-label"
                  >
                    <strong>{universe.title}</strong>
                    <span>{universe.subtitle}</span>
                  </div>
                </div>
              ))}
              <div className="section-05-field-core"><span>GOAT</span><small>VFX</small></div>
            </div>
          </div>

          <footer className="section-05-footer">
            <button type="button" className="section-05-back" onClick={onBack}>← BACK</button>
            <button type="button" className="section-05-next" onClick={onNext}>NEXT <span>→</span></button>
          </footer>
      </div>
    </section>
  );
}



// ============================================
// SECTION 05.1 — BEHIND THE FRAME
// ============================================
function Section051({
  onBack,
  onNext,
  isHidden = false,
  animationsEnabled,
}: {
  onBack: () => void;
  onNext: () => void;
  isHidden?: boolean;
  animationsEnabled: boolean;
}) {
  const [introFinished, setIntroFinished] = useState(!animationsEnabled);
  const [activeStage, setActiveStage] = useState(0);
  const [introNeedsSoundGesture, setIntroNeedsSoundGesture] = useState(false);
  const [finalVideoNeedsGesture, setFinalVideoNeedsGesture] = useState(false);
  const introRef = useRef<HTMLVideoElement>(null);
  const backgroundRef = useRef<HTMLVideoElement>(null);
  const finalVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const startIntroFromNextClick = () => {
      if (!animationsEnabled) {
        setIntroFinished(true);
        return;
      }
      const intro = introRef.current;
      if (!intro) return;
      activateVideo(intro);
      intro.currentTime = 0;
      intro.muted = false;
      intro.defaultMuted = false;
      intro.volume = 1;
      void intro.play().then(() => setIntroNeedsSoundGesture(false)).catch((error) => {
        if (error instanceof Error && error.name === "AbortError") return;
        console.warn("Section 5.1 intro could not start from Next:", error);
        setIntroNeedsSoundGesture(true);
      });
    };
    window.addEventListener("goat:section051-intro-requested", startIntroFromNextClick);
    return () => window.removeEventListener("goat:section051-intro-requested", startIntroFromNextClick);
  }, [animationsEnabled]);

  const stages = [
    {
      number: "01",
      title: "BLENDER",
      subtitle: "WIREFRAME MODELLING",
      type: "image",
      src: "/images/demon-king-blender.webp",
      alt: "Demon king, undead army and Gothic castle in Blender wireframe",
      process: [
        ["CHARACTER MODELLING", "Sculpting the demon king, armour, horns and undead characters."],
        ["ENVIRONMENT MODELLING", "Building the Gothic castle, battlefield and surrounding architecture."],
        ["TOPOLOGY & MESH REFINEMENT", "Developing clean geometry and detailed 3D forms."],
        ["SCENE COMPOSITION", "Arranging characters, army and environment into one cinematic scene."],
      ],
      tools: [
        ["◈", "Blender", "3D workspace"],
        ["◇", "Sculpting", "Character forms"],
        ["▱", "Geometry Nodes", "Procedural assets"],
        ["▦", "UV Mapping", "Mesh preparation"],
      ],
      details: [
        ["WORKFLOW", "3D modelling"],
        ["FOCUS", "Characters & environment"],
        ["OUTPUT", "Wireframe scene"],
      ],
    },
    {
      number: "02",
      title: "TEXTURING",
      subtitle: "MATERIALS & SURFACE DETAIL",
      type: "image",
      src: "/images/demon-king-texturing.webp",
      alt: "Demon king, undead army and Gothic castle with detailed textures",
      process: [
        ["MATERIAL CREATION", "Defining realistic surfaces for armour, stone, skin and fabric."],
        ["SURFACE DETAILING", "Adding weathering, scratches, roughness and fine surface variation."],
        ["UV & TEXTURE WORK", "Preparing texture placement and material detail across the scene."],
        ["LOOK DEVELOPMENT", "Balancing material response so each asset reads clearly."],
      ],
      tools: [
        ["◈", "Blender Shader Editor", "Material setup"],
        ["▧", "PBR Materials", "Surface response"],
        ["▦", "UV Mapping", "Texture placement"],
        ["✧", "Texture Painting", "Surface detailing"],
      ],
      details: [
        ["WORKFLOW", "Material development"],
        ["FOCUS", "Armour, stone & fabric"],
        ["OUTPUT", "Textured scene"],
      ],
    },
    {
      number: "03",
      title: "LIGHTING & CGI",
      subtitle: "CINEMATIC LIGHT & CGI",
      type: "image",
      src: "/images/demon-king-lighting-cgi.webp",
      alt: "Demon king invasion scene with cinematic moonlight and CGI lighting",
      process: [
        ["KEY LIGHTING", "Establishing the moonlight and primary illumination."],
        ["SHADOW & CONTRAST", "Shaping depth across the demon king, army and castle."],
        ["ATMOSPHERIC LIGHT", "Creating volumetric depth through mist and the stormy environment."],
        ["CGI LOOK DEVELOPMENT", "Balancing highlights, reflections and final scene readability."],
      ],
      tools: [
        ["◈", "Blender Cycles", "Rendering"],
        ["☼", "Area Lights", "Scene illumination"],
        ["◉", "HDRI Lighting", "Environment light"],
        ["✧", "Volumetrics", "Atmospheric depth"],
      ],
      details: [
        ["WORKFLOW", "Lighting & rendering"],
        ["FOCUS", "Moonlight & atmosphere"],
        ["OUTPUT", "Cinematic CGI frame"],
      ],
    },
    {
      number: "04",
      title: "VFX COMPOSITING",
      subtitle: "DESTRUCTION & VISUAL EFFECTS",
      type: "image",
      src: "/images/demon-king-vfx-compositing.webp",
      alt: "Demon king and undead army with castle destruction visual effects",
      process: [
        ["DESTRUCTION EFFECTS", "Integrating collapsing architecture and flying debris."],
        ["FIRE & EXPLOSIONS", "Adding fire, sparks and explosive visual elements."],
        ["SMOKE & PARTICLES", "Layering smoke, embers, ash and atmospheric particles."],
        ["FINAL COMPOSITING", "Combining visual layers into one cohesive cinematic frame."],
      ],
      tools: [
        ["✧", "Houdini", "FX simulation"],
        ["▣", "Nuke", "Node compositing"],
        ["◈", "After Effects", "Visual effects"],
        ["☼", "Particle Systems", "Debris & sparks"],
      ],
      details: [
        ["WORKFLOW", "FX & compositing"],
        ["FOCUS", "Fire, smoke & debris"],
        ["OUTPUT", "Composited VFX frame"],
      ],
    },
    {
      number: "05",
      title: "FINAL OUTPUT",
      subtitle: "THE COMPLETED CINEMATIC SEQUENCE",
      type: "video",
      src: "/videos/demon-king-final-output.mp4",
      alt: "Final animated Demon King Invasion cinematic",
      process: [
        ["FINAL SCENE", "All production elements brought together in the finished sequence."],
        ["ANIMATION", "Character, army, environment and camera motion."],
        ["FINAL POLISH", "Finishing the image, timing and cinematic presentation."],
        ["CINEMATIC DELIVERY", "Presenting the completed Demon King Invasion sequence."],
      ],
      tools: [
        ["▶", "Final Animation", "Cinematic sequence"],
        ["◉", "Colour Grading", "Final image look"],
        ["♫", "Sound Design", "Audio atmosphere"],
        ["▣", "Video Export", "MP4 delivery"],
      ],
      details: [
        ["WORKFLOW", "Final presentation"],
        ["FOCUS", "Animation & finishing"],
        ["OUTPUT", "Cinematic video"],
      ],
    },
  ] as const;

  const currentStage = stages[activeStage];
  // Three distinct close-up crops from the currently selected stage image.
  // The source changes with the stage; each crop focuses on a different scene area.
  const thumbnailCrops = [
    { position: "22% 34%", label: "CHARACTER DETAIL" },
    { position: "58% 48%", label: "ENVIRONMENT" },
    { position: "86% 70%", label: "ARMY / FX DETAIL" },
  ];
  const thumbnailSource = activeStage === 4
    ? "/images/demon-king-vfx-compositing.png"
    : currentStage.src;

  useEffect(() => {
    const background = backgroundRef.current;
    if (background) {
      background.muted = true;
      background.loop = true;
      if (isHidden || !introFinished) background.pause();
      else {
        activateVideo(background);
        void background.play().catch(() => {});
      }
    }

    const intro = introRef.current;
    if (isHidden || introFinished || !animationsEnabled) {
      intro?.pause();
      return () => background?.pause();
    }

    if (intro) {
      // Start the intro with sound. If the browser blocks audible autoplay,
      // keep the intro visible and offer a user-gesture playback control.
      activateVideo(intro);
      intro.muted = false;
      intro.defaultMuted = false;
      intro.volume = 1;
      void intro.play().then(() => setIntroNeedsSoundGesture(false)).catch((error) => {
        if (error instanceof Error && error.name === "AbortError") return;
        console.warn("Section 5.1 intro playback needs a user gesture:", error);
        setIntroNeedsSoundGesture(true);
      });
    }

    return () => {
      intro?.pause();
      background?.pause();
    };
  }, [animationsEnabled, introFinished, isHidden]);

  useEffect(() => {
    const video = finalVideoRef.current;
    if (!video) return;
    if (isHidden || !introFinished || activeStage !== 4) {
      video.pause();
      return;
    }
    activateVideo(video);
    video.currentTime = 0;
    video.muted = false;
    video.defaultMuted = false;
    video.volume = 1;
    void video.play().then(() => setFinalVideoNeedsGesture(false)).catch(() => {
      setFinalVideoNeedsGesture(true);
    });
    return () => video.pause();
  }, [activeStage, introFinished, isHidden]);

  useEffect(() => {
    if (isHidden || !introFinished) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") setActiveStage((stage) => Math.min(4, stage + 1));
      if (event.key === "ArrowLeft") setActiveStage((stage) => Math.max(0, stage - 1));
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [introFinished, isHidden]);

  const finishIntro = () => {
    introRef.current?.pause();
    setIntroFinished(true);
  };

  const handleBack = () => {
    introRef.current?.pause();
    setIntroNeedsSoundGesture(false);
    setIntroFinished(false);
    onBack();
  };

  const playIntroWithSound = async () => {
    const intro = introRef.current;
    if (!intro) return;
    intro.muted = false;
    intro.defaultMuted = false;
    intro.volume = 1;
    try {
      await intro.play();
      setIntroNeedsSoundGesture(false);
    } catch (error) {
      console.warn("Section 5.1 intro audio could not start:", error);
    }
  };


  const playFinalWithSound = async () => {
    const video = finalVideoRef.current;
    if (!video) return;
    video.muted = false;
    video.defaultMuted = false;
    video.volume = 1;
    try {
      await video.play();
      setFinalVideoNeedsGesture(false);
    } catch (error) {
      console.warn("Final output video could not start:", error);
    }
  };

  const goToStage = (next: number) => {
    setActiveStage((next + stages.length) % stages.length);
  };

  return (
    <section id="section-05-1" className="section-051 section-051-pro" hidden={isHidden} aria-label="Behind the Frame">
      <video
        ref={backgroundRef}
        className="section-051-background"
        src="/videos/section5-1-background.720p.mp4"
        muted
        loop
        playsInline
        preload="none"
        aria-hidden="true"
      />
      <div className="section-051-backdrop section-051-pro-backdrop" />

      {animationsEnabled && !introFinished && (
        <div className="section-051-intro-layer">
          <video
            ref={introRef}
            className="section-051-intro-video"
            src="/videos/section5-1-intro.720p.mp4"
            muted={false}
            playsInline
            preload="none"
            onEnded={finishIntro}
            onError={finishIntro}
            onPlay={() => setIntroNeedsSoundGesture(false)}
          />
          <div className="section-051-intro-shade" />
          {introNeedsSoundGesture && (
            <button type="button" className="section-051-intro-sound-start" onClick={() => void playIntroWithSound()}>
              PLAY INTRO WITH SOUND
            </button>
          )}
          <button type="button" className="section-051-skip" onClick={finishIntro}>SKIP INTRO</button>
        </div>
      )}

      {introFinished && (
        <div className="section-051-pro-shell">
          <img
            className="section-051-moana-logo-overlay"
            src="/images/moana-logo-overlay.png"
            alt="Disney Moana"
          />
          <header className="section-051-pro-header">
            <div className="section-051-pro-brand">
              <img
                className="section-051-pro-brand-waterflow"
                src="/videos/waterflow.webp"
                alt=""
                aria-hidden="true"
                loading="lazy"
                decoding="async"
              />
              <span>THE GOAT <b>VFX</b></span>
            </div>
            <div className="section-051-pro-heading">
              <span className="section-051-pro-eyebrow">FROM THE FIRST POLYGON TO THE FINAL FRAME</span>
              <h1>BEHIND THE <em>FRAME</em></h1>
              <p>Every frame has a story. Every detail has a process.</p>
            </div>
          </header>

          <div className="section-051-pro-stage-title">
            <h2>{currentStage.title}</h2>
            <span className="section-051-pro-stage-subtitle">{currentStage.subtitle}</span>
          </div>

          <div className="section-051-pro-workspace">
            <aside className="section-051-pro-panel section-051-pro-process">
              <div className="section-051-pro-panel-heading">
                <span className="section-051-pro-panel-icon">⬡</span>
                <div><h3>PRODUCTION PROCESS</h3><p>MODEL · BUILD · PREPARE</p></div>
              </div>
              <div className="section-051-pro-process-list">
                {currentStage.process.map(([title, description], index) => (
                  <article className="section-051-pro-process-item" key={title}>
                    <span className="section-051-pro-process-icon">{["◇", "△", "▱", "▰"][index]}</span>
                    <div><h4>{title}</h4><p>{description}</p></div>
                  </article>
                ))}
              </div>
            </aside>

            <div className={`section-051-pro-viewer ${activeStage === 4 ? "is-final" : ""}`}>
              <div className="section-051-pro-viewer-frame">
                {activeStage < 4 ? (
                  <img
                    key={currentStage.src}
                    className="section-051-pro-stage-image"
                    src={currentStage.src}
                    alt={currentStage.alt}
                    loading="lazy"
                    decoding="async"
                    draggable={false}
                  />
                ) : (
                  <div className="section-051-pro-video-wrap">
                    <video
                      ref={finalVideoRef}
                      src="/videos/demon-king-final-output.mp4"
                      poster="/images/demon-king-vfx-compositing.png"
                      playsInline
                      preload="metadata"
                      disablePictureInPicture
                      onPlay={() => setFinalVideoNeedsGesture(false)}
                    />
                    {finalVideoNeedsGesture && (
                      <button type="button" className="section-051-pro-video-sound" onClick={() => void playFinalWithSound()}>
                        ▶ PLAY FINAL OUTPUT
                      </button>
                    )}
                  </div>
                )}
                <button type="button" className="section-051-pro-arrow section-051-pro-arrow-left" onClick={() => goToStage(activeStage - 1)} aria-label="Previous stage">‹</button>
                <button type="button" className="section-051-pro-arrow section-051-pro-arrow-right" onClick={() => goToStage(activeStage + 1)} aria-label="Next stage">›</button>
              </div>
            </div>

            <aside className="section-051-pro-panel section-051-pro-tools">
              <div className="section-051-pro-panel-heading">
                <span className="section-051-pro-panel-icon">⚒</span>
                <div><h3>TOOLS & TECHNIQUES</h3><p>SOFTWARE · METHODS · PIPELINE</p></div>
              </div>
              <div className="section-051-pro-tool-grid">
                {currentStage.tools.map(([icon, name, detail], index) => (
                  <div className={`section-051-pro-tool ${index === 0 ? "is-highlighted" : ""}`} key={name}>
                    <span>{icon}</span><b>{name}</b><small>{detail}</small>
                  </div>
                ))}
              </div>
              <div className="section-051-pro-details">
                <h3><span>▣</span> PRODUCTION DETAILS</h3>
                {currentStage.details.map(([label, value]) => (
                  <div className="section-051-pro-detail-row" key={label}><span>{label}</span><b>{value}</b></div>
                ))}
              </div>
              <div className="section-051-pro-tech-art" aria-hidden="true">
                <span /><span /><span /><span /><span /><span /><span />
              </div>
            </aside>
          </div>

          <nav className="section-051-pro-timeline" aria-label="Production stages">
            {stages.map((stage, index) => (
              <button
                type="button"
                key={stage.number}
                className={`section-051-pro-step ${index === activeStage ? "is-active" : ""} ${index < activeStage ? "is-complete" : ""}`}
                onClick={() => goToStage(index)}
                aria-current={index === activeStage ? "step" : undefined}
              >
                <span className="section-051-pro-step-icon">{["⬡", "▱", "☼", "✧", "▶"][index]}</span>
                <span><small>{stage.number}</small><b>{stage.title}</b></span>
              </button>
            ))}
          </nav>

          <footer className="section-051-pro-footer">
            <button type="button" className="section-051-pro-nav-button" onClick={handleBack}><span>‹</span><b>BACK</b></button>
            <button type="button" className="section-051-pro-nav-button section-051-pro-next" onClick={onNext}><b>NEXT</b><span>›</span></button>
          </footer>
        </div>
      )}
    </section>
  );
}


// ============================================
// SECTION 06 — THE ART OF VFX (INTRO + BATTLEFIELD)
// ============================================
function Section06({ onBack, onNext, isHidden = false, animationsEnabled }: { onBack: () => void; onNext: () => void; isHidden?: boolean; animationsEnabled: boolean }) {
  const introRef = useRef<HTMLVideoElement>(null);
  const artistRef = useRef<HTMLVideoElement>(null);
  const [introFinished, setIntroFinished] = useState(!animationsEnabled);
  const [needsSoundGesture, setNeedsSoundGesture] = useState(false);
  const [activeFactor, setActiveFactor] = useState<number | null>(null);
  const [pausedFactor, setPausedFactor] = useState<number | null>(null);
  const [visibleFactor, setVisibleFactor] = useState<number | null>(null);
  const finishStartedRef = useRef(false);
  const showcaseRefs = useRef<(HTMLVideoElement | null)[]>([]);

  const factors = [
    {
      number: "1", title: "CGI & 3D CREATION",
      description: "Creating digital characters, creatures and cinematic assets.", accent: "blue",
      stages: [
        { label: "CGI & 3D WORKFLOW", image: "/images/venom-3d-modeling-workflow.webp" },
      ],
      video: "/videos/venom-creature-awakening.mp4", heroAlt: "Final CGI character showcase",
    },
    {
      number: "2", title: "VFX COMPOSITING",
      description: "Combining multiple visual elements into one seamless shot.", accent: "green",
      stages: [
        { label: "VFX COMPOSITING WORKFLOW", image: "/images/warrior-vfx-compositing.webp" },
      ],
      video: "/videos/warrior-rise-of-the-king.mp4", heroAlt: "Final VFX compositing showcase",
    },
    {
      number: "3", title: "ENVIRONMENT DESIGN",
      description: "Building cinematic locations and immersive digital worlds.", accent: "orange",
      stages: [
        { label: "ENVIRONMENT DESIGN WORKFLOW", image: "/images/environment-3d-workflow.webp" },
      ],
      video: "/videos/eclipse-infernal-world.mp4", heroAlt: "Final digital environment showcase",
    },
    {
      number: "4", title: "FX SIMULATION",
      description: "Creating realistic fire, smoke, destruction and energy effects.", accent: "violet",
      stages: [
        { label: "FX SIMULATION WORKFLOW", image: "/images/explosion-vfx-simulation.webp" },
      ],
      video: "/videos/inferno-explosion-vfx.mp4", heroAlt: "Final FX simulation showcase",
    },
  ];

  useEffect(() => {
    const intro = introRef.current;
    if (isHidden) {
      intro?.pause();
      showcaseRefs.current.forEach((video) => video?.pause());
      return;
    }
    if (!animationsEnabled) {
      intro?.pause();
      // Motion preference changes can skip an in-progress intro.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIntroFinished(true);
      return;
    }
    if (introFinished) return;
    if (intro) {
      activateVideo(intro);
      intro.muted = false;
      intro.defaultMuted = false;
      intro.volume = 1;
      void intro.play().then(() => setNeedsSoundGesture(false)).catch(async (error) => {
        if (error instanceof Error && error.name === "AbortError") return;
        intro.muted = true;
        intro.defaultMuted = true;
        try {
          await intro.play();
          setNeedsSoundGesture(true);
        } catch (mutedError) {
          console.warn("Section 06 intro playback failed:", mutedError);
          setIntroFinished(true);
        }
      });
    }
    return () => intro?.pause();
  }, [animationsEnabled, isHidden, introFinished]);

  useEffect(() => {
    const artist = artistRef.current;
    if (!artist) return;
    if (isHidden || !introFinished) {
      artist.pause();
      return;
    }
    activateVideo(artist);
    void artist.play().catch((error) => console.warn("Section 06 workstation video could not autoplay:", error));
    return () => artist.pause();
  }, [activeFactor, introFinished, isHidden]);

  useEffect(() => {
    showcaseRefs.current.forEach((video) => {
      if (!video) return;
      video.pause();
      video.currentTime = 0;
    });
  }, [introFinished, isHidden]);

  // Only the showcase video whose card is actually in view is allowed to
  // decode/play by default. A manually selected factor takes priority.
  useEffect(() => {
    if (isHidden || !introFinished) return;

    const videos = showcaseRefs.current.filter(
      (video): video is HTMLVideoElement => Boolean(video)
    );
    if (!videos.length) return;

    if (!("IntersectionObserver" in window)) {
      // The fallback is only reached after browser capability detection.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVisibleFactor(0);
      return;
    }

    const visibleRatios = new Map<number, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const index = Number((entry.target as HTMLVideoElement).dataset.factorIndex);
          if (entry.isIntersecting) {
            visibleRatios.set(index, entry.intersectionRatio);
          } else {
            visibleRatios.delete(index);
          }
        });
        const mostVisible = [...visibleRatios.entries()].sort(
          (a, b) => b[1] - a[1]
        )[0];
        setVisibleFactor(mostVisible?.[0] ?? null);
      },
      { threshold: [0, 0.2, 0.4, 0.6, 0.8] }
    );

    videos.forEach((video) => observer.observe(video));
    return () => observer.disconnect();
  }, [introFinished, isHidden]);

  useEffect(() => {
    const playbackIndex = activeFactor ?? visibleFactor;

    showcaseRefs.current.forEach((video, index) => {
      if (!video) return;
      if (
        isHidden ||
        !introFinished ||
        playbackIndex !== index ||
        pausedFactor === index
      ) {
        video.pause();
        return;
      }

      const isAudible = activeFactor === index;
      activateVideo(video);
      video.muted = !isAudible;
      video.defaultMuted = !isAudible;
      video.volume = 1;
      void video.play().catch((error) => {
        console.warn("Section 06 showcase video could not autoplay:", error);
      });
    });
  }, [activeFactor, pausedFactor, visibleFactor, introFinished, isHidden]);

  const finishIntro = () => {
    if (finishStartedRef.current) return;
    finishStartedRef.current = true;
    introRef.current?.pause();
    setNeedsSoundGesture(false);
    setIntroFinished(true);
  };

  const playIntroWithSound = async () => {
    const video = introRef.current;
    if (!video) return;
    video.muted = false;
    video.defaultMuted = false;
    video.volume = 1;
    try {
      await video.play();
      setNeedsSoundGesture(false);
    } catch (error) {
      console.error("Section 06 intro could not start with sound:", error);
    }
  };

  const selectFactor = async (index: number) => {
    const selectedVideo = showcaseRefs.current[index];
    if (!selectedVideo) return;
    activateVideo(selectedVideo);

    if (activeFactor === index) {
      if (pausedFactor === index) {
        setPausedFactor(null);
        selectedVideo.muted = false;
        selectedVideo.defaultMuted = false;
        selectedVideo.volume = 1;
        void selectedVideo.play().catch((error) => console.warn(`Could not resume ${factors[index].title}:`, error));
      } else {
        setPausedFactor(index);
        selectedVideo.pause();
      }
      return;
    }

    setActiveFactor(index);
    setPausedFactor(null);

    showcaseRefs.current.forEach((video, videoIndex) => {
      if (!video) return;
      if (videoIndex !== index) {
        video.muted = true;
        video.defaultMuted = true;
        video.pause();
        return;
      }
      video.muted = false;
      video.defaultMuted = false;
      video.volume = 1;
    });

    try {
      await selectedVideo.play();
    } catch (error) {
      console.warn(`Could not play ${factors[index].title} with sound:`, error);
      selectedVideo.muted = true;
      selectedVideo.defaultMuted = true;
      try {
        await selectedVideo.play();
      } catch (fallbackError) {
        console.warn(`Could not start ${factors[index].title} preview:`, fallbackError);
      }
    }
  };

  return (
    <section id="section-06" className="section-06 section-06-pipeline" hidden={isHidden} aria-label="Section 06 — The Art of VFX">
      {animationsEnabled && !introFinished && (
        <div className="section-06-intro-layer">
          <video ref={introRef} className="section-06-intro-video" src="/videos/section%206-intro.mp4" playsInline preload="metadata" onEnded={finishIntro} onError={finishIntro} />
          {needsSoundGesture && <button type="button" className="section-06-sound-start" onClick={playIntroWithSound}>PLAY INTRO WITH SOUND <span>↗</span></button>}
          <button type="button" className="section-06-skip-intro" onClick={finishIntro}>SKIP INTRO</button>
        </div>
      )}

      {introFinished && (
        <div className="section-06-pipeline-shell">
          <header className="section-06-title-card">
            <div className="section-06-artist-window" aria-hidden="true">
              <video ref={artistRef} src="/videos/vfx-artist-workstation.mp4" muted loop playsInline preload="none" aria-hidden="true" />
              <span className="section-06-artist-shade" />
            </div>
            <div className="section-06-title-copy"><h1>THE ART OF VFX</h1><span>THE TECHNIQUES THAT BRING OUR WORLDS TO LIFE</span></div>
            <img className="section-06-logo-glitch" src="/videos/section-06-goat-vfx-tv-glitch.webp" alt="THE GOAT VFX" loading="lazy" decoding="async" />
          </header>
          <main className="section-06-pipeline-list">
            <div className="section-06-progress-rail" aria-hidden="true"><span className="section-06-rail-line" /><span className="section-06-rail-arrow">↓</span></div>
            {factors.map((factor, index) => {
              const isActive = activeFactor === index && pausedFactor !== index;
              return (
                <article className={`section-06-factor section-06-factor-${factor.accent} ${isActive ? "is-active" : ""}`} key={factor.number}>
                  <button type="button" className="section-06-factor-select" onClick={() => void selectFactor(index)} aria-label={`${isActive ? "Pause" : activeFactor === index ? "Resume" : "Play"} ${factor.title} ${activeFactor === index && pausedFactor !== index ? "" : "with sound"}`} aria-pressed={isActive}>
                    <span className="section-06-factor-dot">{factor.number}</span>
                  </button>
                  <div className="section-06-stage-sequence" aria-label={`${factor.title} workflow`}>
                    {factor.stages.map((stage) => <div className="section-06-stage-group" key={stage.label}><div className="section-06-stage-thumb"><img src={stage.image} alt={stage.label} loading="lazy" /></div><span className="section-06-stage-label">{stage.label}</span></div>)}
                    <div className="section-06-factor-copy"><h2>{factor.title}</h2><span className="section-06-factor-rule" /><p>{factor.description}</p></div>
                  </div>
                  <div className="section-06-showcase-media">
                    <video
                       ref={(element) => { showcaseRefs.current[index] = element; }}
                       src={factor.video}
                       data-factor-index={index}
                       muted
                       loop
                       playsInline
                       preload="none"
                       aria-label={factor.heroAlt}
                     />
                    <div className="section-06-showcase-shade" />
                  </div>
                </article>
              );
            })}
          </main>
          <footer className="section-06-pipeline-footer">
            <button type="button" onClick={onBack} className="section-06-back">← BACK</button>
            <button type="button" onClick={onNext} className="section-06-next">NEXT <span>→</span></button>
          </footer>
        </div>
      )}
    </section>
  );
}

// ============================================
// SECTION 07 — THE GOAT'S DOMAIN
// ============================================
function Section07({ onBack, onNext, isHidden = false, animationsEnabled }: { onBack: () => void; onNext: () => void; isHidden?: boolean; animationsEnabled: boolean }) {
  const introRef = useRef<HTMLVideoElement>(null);
  const backgroundRef = useRef<HTMLVideoElement>(null);
  const [introFinished, setIntroFinished] = useState(!animationsEnabled);
  const [introFading, setIntroFading] = useState(false);
  const finishTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finishStartedRef = useRef(false);

  const finishIntro = useCallback(() => {
    if (finishStartedRef.current) return;
    finishStartedRef.current = true;
    setIntroFading(true);
    finishTimerRef.current = setTimeout(() => setIntroFinished(true), 220);
  }, []);

  useEffect(() => {
    const intro = introRef.current;
    const background = backgroundRef.current;
    if (isHidden) {
      intro?.pause();
      background?.pause();
      return;
    }
    if (!animationsEnabled) {
      intro?.pause();
      // Motion preference changes can skip an in-progress intro.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIntroFinished(true);
      if (background) {
        activateVideo(background);
        void background.play().catch(() => {});
      }
      return;
    }
    if (!introFinished && intro) {
      activateVideo(intro);
      intro.currentTime = 0;
      intro.muted = false;
      intro.defaultMuted = false;
      intro.volume = 1;
      void intro.play().catch((error) => {
        console.warn("Section 07 intro playback was blocked:", error);
      });
    } else if (introFinished && background) {
      activateVideo(background);
      void background.play().catch(() => {});
    }
    return () => {
      intro?.pause();
      background?.pause();
    };
  }, [animationsEnabled, finishIntro, introFinished, isHidden]);

  useEffect(() => {
    const background = backgroundRef.current;
    if (!background) return;
    if (isHidden || !introFinished) {
      background.pause();
      return;
    }
    background.muted = true;
    background.loop = true;
    activateVideo(background);
    void background.play().catch(() => {});
    return () => background.pause();
  }, [introFinished, isHidden]);

  useEffect(() => () => {
    if (finishTimerRef.current) clearTimeout(finishTimerRef.current);
  }, []);

  const skipIntro = () => {
    if (finishTimerRef.current) clearTimeout(finishTimerRef.current);
    finishStartedRef.current = true;
    introRef.current?.pause();
    setIntroFading(false);
    setIntroFinished(true);
  };

  return (
    <section id="section-07" className="section-07-domain" hidden={isHidden} aria-label="Section 07 — The Goat's Domain">
      <video ref={backgroundRef} className="section-07-background-video" src="/videos/goat-domain-background.720p.mp4" muted loop playsInline preload="none" aria-hidden="true" />
      <div className="section-07-video-shade" />

      {animationsEnabled && !introFinished && (
        <div className={`section-07-intro-layer ${introFading ? "is-fading" : ""}`}>
          <video ref={introRef} className="section-07-intro-video" src="/videos/goat-awakens-intro.mp4" muted={false} playsInline preload="metadata" onEnded={finishIntro} onError={finishIntro} />
          <button type="button" className="section-07-skip-intro" onClick={skipIntro}>SKIP INTRO <span>↗</span></button>
        </div>
      )}

      {introFinished && (
        <>
        <button type="button" className="section-07-back section-07-back-floating" onClick={onBack}>← BACK</button>
        <button type="button" className="section-07-next section-07-next-floating" onClick={onNext}>NEXT →</button>
        <div className="section-07-content">
          <header className="section-07-header">
            <div className="section-07-wordmark"><img className="section-07-title-gif" src="/videos/7-green-slow.webp" alt="" aria-hidden="true" /><span className="section-07-wordmark-text">THE GOAT <span>VFX</span></span></div>
          </header>

          <div className="section-07-main-grid">
            <div className="section-07-brand-copy">
              <p className="section-07-eyebrow">THE CREATIVE CORE</p>
              <p className="section-07-lead">We are a visual effects and CGI studio driven by imagination, precision and the ambition to create visuals beyond reality.</p>
            </div>

            <aside className="section-07-approach">
              <h2>OUR CREATIVE APPROACH</h2>
              <article><i>✧</i><div><h3>IMAGINATION FIRST</h3><p>Original ideas that push creative boundaries.</p></div></article>
              <article><i>◇</i><div><h3>ARTISTIC PRECISION</h3><p>Detail, composition and visual craftsmanship.</p></div></article>
              <article><i>▦</i><div><h3>TECHNOLOGY DRIVEN</h3><p>Next-generation tools for next-level visuals.</p></div></article>
              <article><i>▣</i><div><h3>EVERY FRAME MATTERS</h3><p>Cinematic quality in every single detail.</p></div></article>
            </aside>
          </div>

          <div className="section-07-lower-grid">
            <section className="section-07-philosophy">
              <h2>OUR VISION &amp; PHILOSOPHY</h2>
              <strong>WE DON’T JUST CREATE<br />WHAT YOU SEE.<br /><em>WE CREATE WHAT YOU IMAGINE.</em></strong>
            </section>
            <p className="section-07-vision-copy">Every great visual begins with an idea. We turn ambitious concepts into immersive visual experiences that feel real, larger than life and timeless.</p>
            <section className="section-07-identity">
              <h2>THE GOAT IDENTITY</h2>
              <div className="section-07-identity-body"><span className="section-07-horn-mark">♈</span><p>GOAT represents ambition, originality and the pursuit of exceptional creative work. It is our symbol of limitless imagination and relentless creativity.</p></div>
            </section>
          </div>

        </div>
        </>
      )}
    </section>
  );
}


// ============================================
// SECTION 08 — CONTACT / THE GOAT AWAKENS
// ============================================
function Section08({ onBack, isHidden = false }: { onBack: () => void; isHidden?: boolean }) {
  const backgroundRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const background = backgroundRef.current;
    if (!background) return;
    if (isHidden) {
      background.pause();
      return;
    }
    background.muted = true;
    background.loop = true;
    activateVideo(background);
    void background.play().catch(() => {});
    return () => background.pause();
  }, [isHidden]);

  return (
    <section id="section-08" className="section-08-contact" hidden={isHidden} aria-label="Section 08 - Contact The GOAT VFX">
      <video ref={backgroundRef} className="section-08-background-video" src="/videos/section-08-goat-awakens.720p.mp4" muted loop playsInline preload="none" aria-hidden="true" />
      <div className="section-08-atmosphere" />
      <img className="section-08-logo-overlay" src="/images/logo-overlay.png" alt="The Goat VFX" />
      <div className="section-08-layout">
        <main className="section-08-copy">
          <p className="section-08-kicker"><span /> CONTACT / THE GOAT AWAKENS</p>
          <h1>LET&apos;S CREATE<br /><em>THE NEXT REALITY.</em></h1>
          <p className="section-08-lead">Have an ambitious idea? Let&apos;s transform it into an extraordinary visual experience.</p>
          <div className="section-08-contact-list">
            <a className="section-08-contact-row" href="mailto:production@thegoatvfx.com"><span className="section-08-contact-icon">&#9993;</span><b>EMAIL</b><span>production@thegoatvfx.com</span><i>&#8599;</i></a>
            <div className="section-08-contact-row"><span className="section-08-contact-icon">&#8982;</span><b>LOCATION</b><span>CHENNAI, TAMIL NADU, INDIA</span></div>
            <a className="section-08-contact-row" href="tel:+917550020036"><span className="section-08-contact-icon">&#9742;</span><b>PHONE</b><span>+91 7550020036</span><i>&#8599;</i></a>
          </div>
        </main>
        <aside className="section-08-project-panel">
          <div className="section-08-panel-corner section-08-panel-corner-a" />
          <div className="section-08-panel-corner section-08-panel-corner-b" />
          <h2>EXPLORE OUR PROJECTS</h2>
          <div className="section-08-qr-empty"><img src="/images/qr.png" alt="Scan to explore our projects" /></div>
          <p>SCAN TO DISCOVER OUR CREATIVE WORK</p>
        </aside>
      </div>
      <div className="section-08-signoff">YOUR IDEA. OUR IMAGINATION. <strong>ONE EXTRAORDINARY RESULT.</strong></div>
      <div className="section-08-bottom-line"><span>VFX</span><i /><span>CGI</span><i /><span>ANIMATION</span><i /><span>CINEMATIC EXPERIENCES</span></div>
      <button type="button" className="section-08-back" onClick={onBack}>&#8592; BACK</button>
    </section>
  );
}

function MainWebsite({ onBack, animationsEnabled }: { onBack: () => void; animationsEnabled: boolean }) {
  const [isLeavingWork, setIsLeavingWork] = useState(false);
  const [isEnteringWork, setIsEnteringWork] = useState(false);
  const [showIronIntro, setShowIronIntro] = useState(false);
  const [showSection03, setShowSection03] = useState(false);
  const [showSection04, setShowSection04] = useState(false);
  const [hasVisitedSection04, setHasVisitedSection04] = useState(false);
  const [showSection05, setShowSection05] = useState(false);
  const [hasVisitedSection05, setHasVisitedSection05] = useState(false);
  const [showSection051, setShowSection051] = useState(false);
  const [showSection06, setShowSection06] = useState(false);
  const [hasVisitedSection06, setHasVisitedSection06] = useState(false);
  const [showSection07, setShowSection07] = useState(false);
  const [showSection08, setShowSection08] = useState(false);
  const [section05IntroRequestId, setSection05IntroRequestId] = useState(0);
  const [section06IntroRequestId, setSection06IntroRequestId] = useState(0);
  const [isSection04Ready, setIsSection04Ready] = useState(false);
  const [isSection04IntroRequested, setIsSection04IntroRequested] = useState(false);

  const startSection07 = () => {
    flushSync(() => setShowSection07(true));
    if (!animationsEnabled) return;
    const intro = document.querySelector<HTMLVideoElement>(".section-07-intro-video");
    if (!intro) return;
    intro.currentTime = 0;
    intro.muted = false;
    intro.defaultMuted = false;
    intro.volume = 1;
    void intro.play().catch((error) => {
      console.warn("Section 07 intro playback with sound was blocked:", error);
    });
  };

  const goToSection08 = () => {
    // Keep Section 07 mounted while hidden so returning from Section 08
    // restores its main page without replaying the intro.
    flushSync(() => {
      setShowSection08(true);
    });
  };

  const goBackToSection07 = () => {
    flushSync(() => {
      setShowSection08(false);
      setShowSection07(true);
    });
  };

  const startSection03 = () => {
    if (isLeavingWork || showIronIntro || showSection03) return;

    console.info("[GOAT VFX] NEXT clicked: starting Section 03 transition");
    setIsLeavingWork(true);
    setIsEnteringWork(false);
    setShowSection03(true);
    setShowIronIntro(animationsEnabled);
  };

  const finishIronIntro = useCallback(() => {
    console.info("[GOAT VFX] Transition complete: revealing Section 03");
    setShowIronIntro(false);
    setShowSection03(true);
  }, []);

  // Switch sections immediately. Section 03 stays mounted but paused so Back
  // can restore its already-buffered video frame without reloading the scene.
  const goToSection04 = () => {
    if (showSection04) return;

    setIsSection04Ready(true);
    setHasVisitedSection04(true);
    setShowSection04(true);
    setIsSection04IntroRequested(animationsEnabled);
  };

  const handleSection04BackgroundReady = useCallback(() => {
    if (isSection04Ready) return;
    setIsSection04Ready(true);
  }, [isSection04Ready]);

  const backToSection03 = () => {
    setShowSection04(false);
    setIsSection04Ready(false);
    setIsSection04IntroRequested(false);
    setShowSection03(true);
  };

  return (
    <main className="goat-main">
      <OurWorkSection
        onBack={onBack}
        onNext={startSection03}
        isLeaving={isLeavingWork}
        isEntering={isEnteringWork}
        isHidden={showIronIntro || showSection03 || showSection04 || showSection05 || showSection06 || showSection07 || showSection08}
      />

      {showSection03 && (
        <Section03
          isHidden={showIronIntro || showSection04 || showSection05 || showSection051 || showSection06 || showSection07 || showSection08}
          onBack={() => {
            setShowSection03(false);
            setIsLeavingWork(false);
            setIsEnteringWork(true);
          }}
          onNext={goToSection04}
        />
      )}
      {showIronIntro && <Section03Transition onComplete={finishIronIntro} />}
      {hasVisitedSection04 && (
        <Section04Placeholder
          onBack={backToSection03}
          onNext={() => {
            if (showSection05) return;
            setHasVisitedSection05(true);
            setSection05IntroRequestId((requestId) => requestId + 1);
            setShowSection05(true);
          }}
          onBackgroundReady={handleSection04BackgroundReady}
          isTransitionReady={isSection04Ready}
          introRequested={isSection04IntroRequested}
          isHidden={!showSection04 || showSection05 || showSection051 || showSection06 || showSection07 || showSection08}
        />
      )}
      {hasVisitedSection05 && (
        <Section05
          key={`section05-${section05IntroRequestId}`}
          animationsEnabled={animationsEnabled}
          isHidden={!showSection05 || showSection051 || showSection06 || showSection07 || showSection08}
          onBack={() => {
            // Return to the already-revealed Section 04 screen without replaying its intro.
            setIsSection04IntroRequested(false);
            setShowSection05(false);
            setShowSection04(true);
          }}
          onNext={() => {
            if (animationsEnabled) window.dispatchEvent(new Event("goat:section051-intro-requested"));
            else window.dispatchEvent(new Event("goat:section051-intro-requested"));
            setShowSection05(false);
            setShowSection051(true);
          }}
        />
      )}
      <Section051
        animationsEnabled={animationsEnabled}
        isHidden={!showSection051 || showSection06 || showSection07 || showSection08}
        onBack={() => {
          setShowSection051(false);
          setShowSection05(true);
        }}
        onNext={() => {
          setHasVisitedSection06(true);
          setSection06IntroRequestId((requestId) => requestId + 1);
          setShowSection051(false);
          setShowSection06(true);
        }}
      />
      {hasVisitedSection06 && (
        <Section06
          key={`section06-${section06IntroRequestId}`}
          animationsEnabled={animationsEnabled}
          isHidden={!showSection06 || showSection07 || showSection08}
          onBack={() => {
            setShowSection06(false);
            setShowSection051(true);
          }}
          onNext={startSection07}
        />
      )}
      {showSection07 && (
        <Section07
          animationsEnabled={animationsEnabled}
          isHidden={!showSection07 || showSection08}
          onBack={() => setShowSection07(false)}
          onNext={goToSection08}
        />
      )}
      {showSection08 && (
        <Section08
          isHidden={!showSection08}
          onBack={goBackToSection07}
        />
      )}
    </main>
  );
}

// ============================================
// MAIN APPLICATION
// ============================================

export default function Home() {
  const [introComplete, setIntroComplete] = useState(false);
  const [animationsEnabled, setAnimationsEnabled] = useState(true);

  return (
    <>
      <CinematicIntro
        isActive={!introComplete}
        animationsEnabled={animationsEnabled}
        onToggleAnimations={() => setAnimationsEnabled((enabled) => !enabled)}
        onComplete={() => setIntroComplete(true)}
      />

      {introComplete && (
        <MainWebsite
          onBack={() => setIntroComplete(false)}
          animationsEnabled={animationsEnabled}
        />
      )}
    </>
  );
}

import { sys } from "@atlas/core";
import { AudioContextResource } from "../resources/audio-context";

/**
 * System that sets up user interaction listeners to resume the AudioContext
 *
 * Browser autoplay policies require user interaction before playing audio.
 * This system sets up one-time listeners that resume the context on first interaction.
 */
export const resumeAudioContextSystem = sys(({ commands }) => {
  const audioContext = commands.getResource(AudioContextResource);

  // Only set up listeners if context is suspended
  if (audioContext.state === "suspended") {
    const resumeContext = async () => {
      try {
        await audioContext.resume();
        console.log("AudioContext resumed after user interaction");
      } catch (error) {
        console.error("Failed to resume AudioContext:", error);
      }
    };

    // Set up one-time event listeners for various user interactions
    const events = ["click", "keydown", "touchstart"];

    const handleInteraction = () => {
      resumeContext();
      // Remove all listeners after first interaction
      events.forEach((event) => {
        document.removeEventListener(event, handleInteraction);
      });
    };

    events.forEach((event) => {
      document.addEventListener(event, handleInteraction, { once: true });
    });
  }
}).label("Audio::ResumeContext");

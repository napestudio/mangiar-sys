import gsap from "gsap";
import { CustomEase } from "gsap/dist/CustomEase";
import { SplitText } from "gsap/dist/SplitText";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import { ScrambleTextPlugin } from "gsap/dist/ScrambleTextPlugin";

gsap.registerPlugin(CustomEase, SplitText, ScrollTrigger, ScrambleTextPlugin);

const GOLDEN_RATIO = (1 + Math.sqrt(5)) / 2;
const RECIPROCAL_GR = 1 / GOLDEN_RATIO;
const DURATION = RECIPROCAL_GR;
const EASE = CustomEase.create("ease", "0.175, 0.885, 0.32, 1");

gsap.config({
  autoSleep: 60,
  nullTargetWarn: false,
});

gsap.defaults({
  duration: DURATION,
  ease: EASE,
});

export {
  CustomEase,
  DURATION,
  EASE,
  GOLDEN_RATIO,
  gsap,
  SplitText,
  ScrollTrigger,
  ScrambleTextPlugin,
};

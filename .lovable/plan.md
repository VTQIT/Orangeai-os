

## Plan: Enlarge and Bounce the Jollibee Confirmed GIF

### Changes (single file: `src/components/JollibeeStore.tsx`)

1. **Increase GIF size** — Change the confirmed view's container from `w-24 h-24` to `w-40 h-40`, and the inner `<img>` from `w-20 h-20` to `w-36 h-36`
2. **Add bounce animation** — Replace the current spring `scale` animation on the `motion.div` with a keyframe sequence that scales up with a bounce effect (overshoot to 1.15, settle back to 1.0), plus add a repeating subtle bounce using Framer Motion's `transition.repeat`


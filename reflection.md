# Reflection: Is Classifying Emotion with AI a Good Idea?

Building this labeling task made the difficulty of the underlying problem concrete
before any model gets involved. Six people can read the same tweet — "I can't stop
smiling, I finally got the internship" — and mostly agree it's joy. But the tweets I
sampled from `dair-ai/emotion` are full of harder cases: sarcasm, mixed feelings,
context-dependent phrasing, and one-line fragments where the "correct" label is a
judgment call even for a human annotator, let alone a fixed taxonomy of six emotions.
That is the first problem: **emotion labels are not the same kind of thing as, say, a
part-of-speech tag.** They are compressed, culturally situated interpretations of
someone's internal state, made from a thin slice of text with no access to tone,
face, body, or situation.

This is exactly the concern raised by Lisa Feldman Barrett and colleagues in their
review of the scientific evidence behind "basic emotion" theory (*Emotional
Expressions Reconsidered*, 2019). Their meta-analysis found that outward signals
people are assumed to reliably produce and reliably read — facial configurations in
particular — vary enormously across individuals, contexts, and cultures, and do not
map cleanly onto categories like anger or fear. The six-category scheme this
assignment uses (Ekman's basic emotions, adapted by the dataset's authors from
distant-supervised tweet labels) inherits that same theoretical assumption: that
internal, continuous, culturally inflected emotional experience can be discretized
into six universal buckets and inferred from surface behavior — here, 280 characters
of text instead of a facial photograph. If that premise is shaky for faces, it is
shakier for tweets, where irony, performance, and platform norms further distort the
signal.

The second problem is what happens once such a classifier exists and is trusted more
than the evidence warrants. Kate Crawford and Trevor Paglen's *Excavating AI* and
Crawford's *Atlas of AI* trace how affect-recognition systems, once built, get
deployed in hiring screens, classroom "engagement" monitoring, insurance pricing, and
policing — contexts where a wrong inference is not a research footnote but a
consequential decision about a real person, often without their knowledge or consent.
Andrew McStay's work on "emotional AI" documents the commercial infrastructure built
on exactly this promise — advertising and workplace-monitoring products that claim to
read affect from voice, face, or text — and how thin the validation behind many of
these products actually is. Regulators have started to take the concern seriously:
the EU AI Act classifies emotion-recognition systems in workplaces and schools as
"unacceptable risk" and bans them outright, precisely because the inference is
unreliable, the labels are contested, and the power asymmetry between the system's
operator and the person being read is stark.

Two things stood out to me while actually building the pipeline:

1. **Ground truth is itself a modeling choice, not a fact.** The dataset's labels
   were produced by distant supervision from emotion hashtags the original tweet
   author chose to attach — a reasonable proxy, but still one step removed from
   "the emotion the person felt," and shaped by whichever hashtag happened to be
   popular or legible at the time. Treating that as ground truth for evaluating
   annotators (or a downstream classifier) quietly launders a fairly shaky signal
   into an authoritative-looking column in a spreadsheet.
2. **Forcing a single label erases real ambiguity.** My interface, like the
   original dataset, requires exactly one of six categories per tweet. Several of
   the sampled tweets could plausibly be labeled two different ways (e.g., a tweet
   expressing anxious anticipation could read as fear or surprise). A single-label
   UI makes that ambiguity invisible in the resulting data, which then gets used —
   here, and in real products — as if it were unambiguous.

None of this means emotion-related NLP research is worthless — understanding
sentiment at a *population* level (e.g., aggregate mood shifts in public discourse)
is a much lower-stakes and better-supported use than inferring a *specific
individual's* internal state from a short text and acting on it. But this exercise
reinforced why "can we build a classifier for this" and "should this classifier make
decisions about people" are different questions, and why the second one deserves at
least as much rigor as the first.

**References**
- Barrett, L. F., Adolphs, R., Marsella, S., Martinez, A. M., & Pollak, S. D. (2019).
  Emotional Expressions Reconsidered: Challenges to Inferring Emotion From Human
  Facial Movements. *Psychological Science in the Public Interest*, 20(1), 1–68.
- Crawford, K., & Paglen, T. (2019). *Excavating AI: The Politics of Images in
  Machine Learning Training Sets*.
- Crawford, K. (2021). *Atlas of AI*. Yale University Press.
- McStay, A. (2018). *Emotional AI: The Rise of Empathic Media*. Sage.
- European Commission. *EU Artificial Intelligence Act*, Article 5 (prohibited
  practices — emotion recognition in the workplace and educational institutions).

*(Note: this course may have assigned specific readings on this topic that weren't
available to me while writing this; the argument above draws on the broader,
well-established literature on the same critique rather than a specific syllabus
reading list.)*

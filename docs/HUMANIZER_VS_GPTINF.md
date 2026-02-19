# Our Humanizer vs GPTInf – What Works Better

Comparison based on the same source (baseball history essay): our output was flagged 100% AI; GPTInf’s reads more human. Here’s what differs.

## 1. **Wrong synonym swaps (we introduced errors)**

- **Our output:** “substantial League Baseball,” “an notable transition.”
- **Cause:** We replace the word “major” with “substantial”/“notable” even inside **proper phrases** like “Major League Baseball,” and we didn’t fix “a/an” after swapping.
- **GPTInf:** Keeps “Major League Baseball,” “important milestone,” “significant” only where it fits. No broken proper nouns.
- **Fix:** Do **not** replace “major” when it’s part of “Major League” / “major league.” Add a post-pass to fix article + adjective (“an notable” → “a notable”) or avoid swaps that break grammar.

## 2. **Over-formal, thesaurus-heavy language**

- **Ours:** “Frequently termed,” “possesses an intricate and storied background,” “watershed event,” “profound inequality,” “profoundly embedded,” “mirrors larger shifts within American culture and society,” “offers a window into the ways athletic competition can mold.”
- **GPTInf:** “Often called,” “has a long and complex history,” “the single most important event,” “considerable injustices,” “deeply woven,” “reflects broader changes.” Same ideas, **plainer** words.
- **Takeaway:** We pushed “variation” so hard it became **more** formal and abstract. Humanizers that pass detectors tend to **simplify** and use everyday vocabulary, not fancier synonyms.

## 3. **Repetition of the main subject**

- **Ours:** We vary “baseball” → “the sport,” “the game,” “pastime,” “America’s pastime” a lot. Reads like an over-edited essay.
- **GPTInf:** Repeats “baseball” often (“baseball has continued,” “baseball remains,” “From Little League baseball to Major League Baseball,” “millions of baseball fans”). Feels natural and cohesive.
- **Takeaway:** Humans often **repeat** the topic word. Forcing variation on the main subject can backfire and feel AI-ish.

## 4. **Sentence length and rhythm**

- **Ours:** Many long, balanced sentences with similar structure; lots of semicolons and “, and.” Still feels uniform.
- **GPTInf:** More mix: short declaratives (“The single most important event…”), some longer sentences, occasional run-ons. More uneven, human rhythm.
- **Takeaway:** We need **more short, direct sentences** and **less** “medium-long, medium-long” patterning.

## 5. **Stock phrases and clichés**

- **Ours:** Still uses “watershed event,” “opened doors,” “color barrier,” “profoundly embedded,” “embodies … the ongoing narrative.” These are common AI/formal tropes.
- **GPTInf:** “Broke the color barrier,” “simply not true,” “talent has no color,” “prejudices … were misplaced.” Slightly more direct and less formulaic.
- **Takeaway:** Prefer **concrete, simple** phrasing over grand abstract nouns (“transition,” “emergence,” “integration,” “narrative”).

## 6. **Grammar and consistency**

- **Ours:** “an notable,” “substantial League Baseball,” “proved ability knew” (missing “that”), “alexander” / “robinson” lowercase. We introduced errors.
- **GPTInf:** Clean grammar, consistent caps.
- **Takeaway:** Synonym swaps must **never** break proper nouns or grammar. Add safeguards and a light grammar/consistency pass.

---

## Summary: What to change in our pipeline

| Area | Change |
|------|--------|
| **Synonyms** | Never replace “major” in “Major League.” Add more “protected phrases” for proper nouns and set terms. |
| **Prompts** | Prefer **plainer, simpler** wording; allow **repetition** of the main subject (e.g. “baseball”); aim for **short + long** sentence mix, not uniformly medium-long. |
| **Post-process** | Fix “a/an” after adjective swaps; optionally restore “Major League” if it was wrongly replaced. |
| **Tone** | Shift from “maximum variation / perplexity” toward “natural, plain, slightly repetitive” like GPTInf. |

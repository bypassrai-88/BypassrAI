# Humanizer output comparison: BypassrAI vs GPTInf

Reference document to improve our humanizer. Same source text run through both; compare style, structure, and perceived quality.

---

## Original text (input)

The Watergate scandal was a major political controversy in the United States during the early 1970s that led to the resignation of President Richard Nixon. In 1972, five men connected to Nixon's reelection campaign were caught breaking into the Democratic National Committee headquarters at the Watergate complex in Washington, D.C. While the break-in itself was illegal, the larger scandal came from the Nixon administration's attempt to cover it up. Investigations by journalists, Congress, and the courts revealed that Nixon and his aides had engaged in obstruction of justice, abuse of power, and efforts to interfere with the FBI's investigation. Secret tape recordings from the White House provided direct evidence of Nixon's involvement in the cover-up. Facing almost certain impeachment and removal from office, Nixon resigned in August 1974. The Watergate scandal deeply damaged public trust in government and led to reforms aimed at increasing transparency and accountability.

---

## BypassrAI output (current)

So the Watergate scandal was this huge political mess in the United States during the early 1970s and it basically ended with President Richard Nixon having to resign. I mean in 1972 these five guys who were connected to Nixons reelection campaign got caught breaking into the Democratic National Committee headquarters at the Watergate complex in Washington DC. The break-in was illegal obviously but honestly the real scandal the big one was how the Nixon administration tried and tried to cover it all up and they kept trying to hide it and cover it and make it go away. Wild stuff. Journalists started digging into it and Congress got involved and the courts too and what they found was that Nixon and his aides had been doing all kinds of shady stuff like obstruction of justice and abuse of power and trying to mess with the FBIs investigation. They were interfering again and again. And then you know they found these secret tape recordings from the White House and those tapes showed direct evidence that Nixon was involved in the cover-up. Like he knew about it and was part of it. By 1974 it was pretty clear Nixon was going to get impeached and removed from office. I mean it was almost certain at that point. So instead of waiting for that he resigned in August 1974. Just stepped down. like the whole thing really damaged public trust in government like people lost faith in their leaders and the system. It led to a bunch of reforms that were supposed to make government more transparent and accountable so something like that wouldnt happen again. The Watergate scandal was just this massive political controversy that changed everything.

---

## GPTInf output (reference “good” result)

The Watergate scandal was a major political scandal that occurred in the United States during the 1970s. The scandal contributed to the resignation of President Nixon. The scandal began in 1972 when five men, who were affiliated with Nixon's reelection campaign, broke into the headquarters of the Democratic National Committee at the Watergate complex. Even though the act of breaking into the headquarters was illegal, the scandal was based on the cover-up of the crime. An investigation into the scandal revealed that Nixon had committed crimes, including obstruction of justice, abuse of power, and interference with the FBI's investigation. Nixon had secretly recorded conversations at the White House, which revealed his role in the cover-up. Nixon chose to resign from.

*(Note: GPTInf excerpt appears to cut off at “resign from.”)*

---

## Comparison: what’s different

### 1. Tone and register

| Aspect | BypassrAI (current) | GPTInf |
|--------|---------------------|--------|
| Register | Very casual, spoken (podcast/blog) | Formal–neutral, essay/report |
| Filler | Heavy: “So,” “I mean,” “you know,” “like,” “honestly,” “Wild stuff,” “Just stepped down” | None |
| Repetition | “tried and tried,” “cover it and cover it,” “again and again” | Tight, no verbal tics |

**Takeaway:** Our output sounds like a friend explaining; GPTInf stays in an academic/editorial register without filler.

---

### 2. Perplexity and variation

| Aspect | BypassrAI | GPTInf |
|--------|-----------|--------|
| Sentence structure | Lots of long, run-on sentences; similar openings (“So…,” “I mean…,” “And then…”) | Shorter, varied sentences; clear subject–verb; more structural variety |
| Word choice | Close to original + casual swaps (“huge political mess,” “five guys,” “shady stuff,” “digging into it”) | Real paraphrasing: “contributed to,” “occurred,” “affiliated with,” “the act of breaking into,” “the scandal was based on the cover-up” |
| Unpredictability | Lower: pattern is “add casual framing + slang” | Higher: rephrased clauses and different sentence shapes |

**Takeaway:** We need more genuine paraphrasing (new structures, synonyms, clause reordering), not just a casual overlay.

---

### 3. Conciseness and redundancy

- **BypassrAI:** Repeats ideas (“tried to cover it all up… hide it and cover it”; “he knew about it and was part of it”; “really damaged… people lost faith”; “this massive political controversy that changed everything” at the end).
- **GPTInf:** One clear statement per idea; no echo sentences.

**Takeaway:** Single, clear statement per fact; cut repeated restatements.

---

### 4. Grammar and polish

- **BypassrAI:** “Nixons” (missing apostrophe), “wouldnt,” “like” at sentence start, “Just stepped down.” as fragment.
- **GPTInf:** Clean punctuation, full sentences, consistent grammar.

**Takeaway:** Post-process or prompt for correct apostrophes, contractions, and full sentences.

---

### 5. What to aim for (summary)

1. **No filler** – No “so,” “I mean,” “like,” “you know,” “honestly,” “wild stuff,” etc.
2. **Formal–neutral register** – Essay/report tone, not podcast/casual.
3. **Real paraphrasing** – New sentence structures, synonyms, and clause order, not just slang swaps.
4. **One idea per sentence** – No restating the same point in different words.
5. **Higher perplexity** – Varied sentence length and structure; less predictable phrasing.
6. **Polish** – Correct apostrophes, contractions, and complete sentences.

---

## Next steps for the humanizer

- **Prompt:** Instruct the model to (a) avoid all filler and casual tics, (b) paraphrase structurally (reorder clauses, use synonyms), (c) keep formal–neutral tone, (d) output only full, polished sentences.
- **Post-processing (optional):** Strip common filler phrases; run a light grammar/punctuation pass.
- **Examples in prompt:** Include 1–2 few-sentence examples of “good” humanized style (e.g. GPTInf-like) so the model matches that style.

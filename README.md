# ebt-deepl
The ebt-deepl repository is a Javascript library 
for Early Buddhist Texts (EBT) translation using DeepL.

Translation is difficult. It is difficult because definitions
are fluid as they are adapted to communicate societal needs
and desires. And when societal needs and desires change 
quickly, as they are today, the translation also has to 
deal with the communication gaps between living generations 
within a single society.
For an internet world, that translation problem is global.
Translating texts takes time. Translation takes years. 
And in those long years, a new generation will be born,
a new generation that will grow up to create their own
terms and catch phrases, unknowing and unwilling 
to learn the words for the needs and desires of 
older generations.

Yet in that stormy flood of change, there are invariants.
The invariants that remain do so regardless of the names
by with which they are painted. 
Praised, reviled, ignored, remembered or forgotten,
those invariants stand true through the generations,
through the ages. 

And, if we are to understand each other, 
we have to start with those invariants.
Indeed, reliable communication relies on shared, 
verifiable truths. The security of the internet
itself relies on shared verifiable truths.
For the internet, those truths are SSL certificates.
But to understand each other meaningfully,
we need to talk about _meaningful_ truths.

What is meaningful?

Well, judging from the internet, there appears to
be a lot of meaningless drama in the world. 
There is a lot of suffering. 
And if suffering is a problem,
then if there was an end to suffering, perhaps
that might be something good to talk about.
Indeed, the internet devotes a lot of bandwidth
to various purported means of ending suffering. 
We have pop-up ads and we have math videos.
Oddly, pop-up ads claim to end suffering but
rarely do, whereas math videos exclude
suffering from discourse since suffering is
not a computable axiom.

Interestingly, thousands of years ago, someone
did talk about noble truths. In fact, that
very notable person did call them Noble Truths
and declared them to be self-verifiable.
And thousands of years later, people are still
finding those Noble Truths meaningful.

> [DN1:1.3.2](https://suttacentral.net/dn1/en/sujato#dn1:1.3.2): “It’s incredible, reverends, it’s amazing how the diverse convictions of sentient beings have been clearly comprehended by the Blessed One, who knows and sees, the perfected one, the fully awakened Buddha.

One of the most fascinating things about these
Noble Truths is that they have survived
and flourished with repeated translation.
They have remained meaningful through generations
and ages. In other words, the Four Noble Truths,
might be a remarkable basis for translation
and communication about meaningful topics.
So although we could talk about things like
painting ourselves to look young, 
we might instead 
wish to talk about ending suffering 
reliably and verifiably.

But wait. We need more than four truths
for translation. Bummer.

Well, math found a solution to a paucity of truth.
It's called the proof. Math has few axioms and many
proofs that extend those axioms in useful ways
that mathematicians discuss endlessly.

Can the four Noble Truths be extended in the same
way? Well, the EBTs do claim so:

> [MN80:16.5](https://suttacentral.net/mn80/en/sujato#mn80:16.5): Let a sensible person come—neither devious nor deceitful, a person of integrity. I teach and instruct them.  
> [MN80:16.6](https://suttacentral.net/mn80/en/sujato#mn80:16.6): Practicing as instructed they will soon know and see for themselves,

It would appear then that the Early Buddhist Texts
might prove to be a consistent, reliable, and verifiable 
candidate for a contemporary translation basis.

And why does that matter?

Well, if we take a consistent,
reliable, and verifiable basis for contemporary translation
and feed it to a machine translator,
we might be able to understand each other better
and talk about finding solutions meaningful things...

### DeepL
[DeepL](https://deepl.com) is a state-of-the-art
automated translator. 
DeepL has a [glossary feature](https://support.deepl.com/hc/en-us/articles/360021634540-About-the-glossary-feature)
that supports the customization of vocabulary
for selected purposes.
And the glossary feature is remarkably well-suited
for representing a large translation basis.
DeepL allows for up to 5000 glossary entries,
which provides a customizable basis of up to a solid [B2 level](https://preply.com/en/blog/english-language-levels/#:~:text=When%20you%20reach%20B1%2C%20you,pass%20the%20B1%20Cambridge%20examination.)

And with DeepL customized this way, 
we could talk together,
if we wanted to, about
everyday things and about meaningful things.

> [iti75:5.2](https://suttacentral.net/iti75/en/sujato#iti75:5.2): It’s when some person gives to everyone—whether ascetics and brahmins, paupers, vagrants, nomads, or beggars—such things as food, drink, clothing, vehicles; garlands, perfumes, and makeup; and bed, house, and lighting.

### The EBT-DeepL project 

The EBT-DeepL project is still in a research phase
researching how to create
a reliable translation basis using the EBTs.
In particular, we have found it quite useful to 
rely on the semantic web of meaning 
discovered in 
[curated examples](https://github.com/ebt-site/ebt-data/tree/published/examples)
for guiding EBT readers through
modern translations of the Pali Early Buddhist Texts
found on [SuttaCental](https://suttacentral.net).

The curated EBT examples reveal remarkable attention to
consistency within the prose EBTs.  
Terms are repeated throughout the EBTs
and used quite consistently with remarkable nuance,
in contexts both broad and deep.
Searching for curated examples reveals
an amazingly rich semantic web that has
assisted ongoing human translation efforts
over the ages. 
Indeed, the process of translation itself
fosters additional discussions which
reveal deeper connections within the EBTs.
Because of this, we rely on the curated EBT examples 
to guide our efforts in building
the EBT-DeepL glossaries.

Briefly, our process is simple:

1. Choose an example
1. Choose a short document with that example
1. Compare the DeepL translation with the human EBT translation
1. Update the DeepL glossaries with the guidance of human EBT translators
1. Publicly provide DeepL translations with [MIT License](https://opensource.org/license/mit/), thereby allowing human EBT translators to refine their own translations.
1. Repeat with another example

Finally, we are very grateful to Bhante Sujato
and the entire SuttaCentral community 
for their joint work in continuosly translating
the Early Buddhist Texts for all to read.

### Create DeepL account

* Login to your [DeepL account](https://deepl.com) and use the top-right menu to open your ```Account``` settings
* Choose the ```Account``` tab to show your authentication key
* Copy the authentication key

### Clone and test repositiory

```
git clone https://github.com/sc-voice/ebt-deepl.git
npm install
mkdir local
echo YOUR_AUTHENTICATION_KEY > local/deepl.auth
npm run test
```


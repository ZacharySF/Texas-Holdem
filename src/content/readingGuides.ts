import type { LessonId } from './lessonTypes';

/** Authored reading support; numerical results remain in the tested facts registry. */
export interface ReadingGuide {
  prerequisites: readonly LessonId[];
  introduction: string;
  takeaway: string;
  mistake: string;
  question: string;
  answer: string;
}
export const readingGuides: Readonly<Record<LessonId, ReadingGuide>> = {
  '0-1': {
    prerequisites: [],
    introduction:
      'Learn what happens during one hand before worrying about which action is best. We will follow the cards, the chips, and the choices in that order.',
    takeaway:
      'A call pays only the amount you still owe on the current betting round. Folding gives up the pot, including chips you committed earlier.',
    mistake:
      'Confusing a bet’s total size with the additional chips needed to call can make an affordable action look expensive, or the reverse.',
    question:
      'You have already matched the current bet. Does that necessarily mean the betting round is over?',
    answer:
      'No. Another player may still be entitled to act and raise. A round ends when the betting obligations are settled and no further action is pending. Follow the action around the table before expecting the next card.',
  },
  '0-2': {
    prerequisites: ['0-1'],
    introduction:
      'You now know how a hand reaches showdown. Let’s compare the cards that actually count, then see why your seat changes when you act.',
    takeaway:
      'Compare each player’s strongest five-card hand. Unused cards and suits cannot break a tie between equal best fives.',
    mistake:
      'Keeping your original hole-card label in mind can hide a stronger hand made mostly, or entirely, from the board.',
    question:
      'If the board is a royal flush, can a player win by holding a higher unused card?',
    answer:
      'No. Everyone who reaches showdown can use the same royal flush. Each best five is equal, so the pot is shared. There is no sixth-card tiebreaker. Compare only the five cards selected for each player.',
  },
  '1-1': {
    prerequisites: [],
    introduction:
      'We’ll begin with one shuffled deck and one question: will the next card be an ace? The names come after the things they describe.',
    takeaway:
      'An outcome is one possible result. An event is a collection of results you care about. Count favorable outcomes over all outcomes only when those outcomes are equally likely.',
    mistake:
      'Two labels do not imply two equal chances. “Ace” and “not ace” collect different numbers of physical cards.',
    question:
      'For a one-card draw, are “a red card” and “the ace of hearts” the same event because both can include Ah?',
    answer:
      'No. Ah belongs to both events, but every other heart and every diamond also satisfies the red-card event. The ace-of-hearts event contains only Ah. The experiment stays the same while the favorable set changes.',
  },
  '1-2': {
    prerequisites: ['1-1'],
    introduction:
      'The same chance can look quite different as a fraction, a percentage, or odds. We’ll translate between them while keeping the underlying cards fixed.',
    takeaway:
      'Probability compares successes with all outcomes. Odds against compare failures with successes. “One in” includes the successful outcome in its total.',
    mistake:
      'A frequency description is not a timetable. Repeated misses do not schedule a success on the next fresh deal.',
    question:
      'Why is the “one in” number larger than the number quoted as odds against for the same event?',
    answer:
      'The “one in” total includes one successful unit as well as the unsuccessful units. Odds against count just the unsuccessful units per successful unit. Check what each denominator includes before converting.',
  },
  '2-1': {
    prerequisites: ['1-1'],
    introduction:
      'You can count a sequence by drawing its branches. We’ll start with a tiny deck, then use exactly the same reasoning for two cards from a full deck.',
    takeaway:
      'Multiply along a sequence using the possibilities left after each earlier choice. Add separate, non-overlapping paths to count alternative ways to succeed.',
    mistake:
      'Copying the first fraction into the second draw quietly assumes the card was replaced. In a deal without replacement, it was not.',
    question:
      'After drawing an ace, why does an ace-then-king calculation keep all four kings but reduce the total cards available?',
    answer:
      'The first draw removed a card, so fewer cards remain. That removed card was an ace, so no king was removed. Recount the favorable cards and all available cards separately; they do not always decrease together.',
  },
  '2-2': {
    prerequisites: ['2-1'],
    introduction:
      'Factorial notation is a short way of writing a count you already understand. We’ll fill positions one at a time before shortening the arithmetic.',
    takeaway:
      'A factorial counts complete arrangements of distinct objects. A partial ordered selection stops multiplying when its recorded positions are full.',
    mistake:
      'Arranging cards you never record adds extra outcomes to the experiment. Stop at the number of positions the question actually asks for.',
    question:
      'You select a first and second card from four labels. Should your count include all the ways to arrange the two unused labels?',
    answer:
      'No. Those unused positions are not part of the recorded outcome. Each first-and-second selection would be counted repeatedly if you also arranged the leftovers. Count choices only for positions that belong to the question.',
  },
  '3-1': {
    prerequisites: ['2-2'],
    introduction:
      'Dealing A then B and B then A gives the same two-card hand. Let’s group those repeated descriptions before introducing the choose formula.',
    takeaway:
      'A combination counts an unordered selection. Divide ordered selections by the number of arrangements describing each selected set.',
    mistake:
      'An unordered favorable count divided by an ordered total mixes two counting units. Both counts must describe the same kind of outcome.',
    question:
      'If you remove duplicate dealing orders from both the favorable count and the total count, should the probability change?',
    answer:
      'No, provided every selected set has the same number of dealing orders. Both counts shrink by the same factor, so their ratio stays the same. You changed the description of an outcome, not the experiment’s chance of success.',
  },
  '3-2': {
    prerequisites: ['3-1'],
    introduction:
      'A starting-hand chart gives each class the same amount of screen space. The deck does not give each class the same number of combinations.',
    takeaway:
      'Weight hand classes by their physical combinations. Pair, suited, and offsuit classes contain different numbers of possible hands.',
    mistake:
      'Choosing a hand-chart cell uniformly is a different experiment from dealing two cards uniformly from a deck.',
    question:
      'Why don’t we divide the ace-suit and king-suit choices by two when counting AK offsuit?',
    answer:
      'The ranks already identify the two roles. Choosing hearts for the ace and spades for the king makes different physical cards from choosing spades for the ace and hearts for the king. We have not counted a reversed dealing order twice.',
  },
  '4-1': {
    prerequisites: ['3-1'],
    introduction:
      'Sometimes success has several cases while failure has only one. We’ll use that observation to count hands containing at least one ace.',
    takeaway:
      'The complement contains every outcome where the event fails. Its probability and the event’s probability add to the whole.',
    mistake:
      '“At least one” includes multiple successes. Replacing it with “exactly one” leaves out valid outcomes.',
    question:
      'Is a two-ace hand included when we calculate “at least one ace” by subtracting the no-ace hands?',
    answer:
      'Yes. A two-ace hand is outside the no-ace group, so it survives the subtraction. So does a one-ace hand. Counting failure first includes both kinds of success without counting either hand twice.',
  },
  '4-2': {
    prerequisites: ['4-1'],
    introduction:
      'We’ll count “ace or spade” by inspecting the one card shared by both descriptions. That single overlap explains the whole addition rule.',
    takeaway:
      'For “A or B,” add the two event counts and subtract their overlap once. The overlap still belongs in the answer.',
    mistake:
      'Mutually exclusive and independent mean different things. First decide whether both descriptions can hold for one outcome.',
    question:
      'After adding the aces and the spades, why do we subtract the ace of spades once instead of twice?',
    answer:
      'It was included once in each list. Subtracting one copy leaves one copy, which is correct because it satisfies the event. Subtracting both copies would wrongly exclude a successful outcome.',
  },
  '5-1': {
    prerequisites: ['1-1', '2-1'],
    introduction:
      'New information changes what can still happen. We’ll cross known cards off a deck list and rebuild the fraction from what remains.',
    takeaway:
      'Remove every known unavailable card from the total. Remove it from the favorable count only if it satisfied the event.',
    mistake:
      'A hidden folded card has an unknown identity. Treating it as a particular dead card claims information you do not have.',
    question:
      'Does exposing a non-ace affect the chance of drawing an ace, even though no ace disappeared?',
    answer:
      'Yes. The number of available aces is unchanged, but they now sit inside a smaller pool of possible next cards. The denominator changes while the numerator stays fixed. Conditioning can change a chance without removing a favorable card.',
  },
  '5-2': {
    prerequisites: ['2-1', '4-2', '5-1'],
    introduction:
      'A tree keeps track of what is known at each step. We’ll compare the branch where the first draw hits with the branch where it misses.',
    takeaway:
      'Multiply conditional chances along each path. Add disjoint paths when several sequences satisfy the event.',
    mistake:
      'Using the same second-draw fraction under both branches ignores whether the first draw removed a favorable card.',
    question:
      'Which paths belong to “exactly one ace” in two draws, and which extra path belongs to “at least one”?',
    answer:
      'Exactly one includes ace then non-ace and non-ace then ace. At least one also includes ace then ace. These paths are disjoint, so their probabilities can be added without subtracting an overlap.',
  },
  '6-1': {
    prerequisites: ['0-2', '3-1', '4-2'],
    introduction:
      'We’ll count hands by their strongest category. Start with one five-card category and its exclusions before trying to understand the entire table.',
    takeaway:
      'Hand categories must be disjoint when their counts are added. With seven cards, classify each whole deal by its strongest five.',
    mistake:
      'Counting every five-card subset of a seven-card deal counts that deal repeatedly and may assign it several categories.',
    question:
      'Where should a seven-card deal containing two different triples appear in the final category table?',
    answer:
      'In full house: use all three cards of one rank and two of the other. Do not also add it to trips. A category table records the strongest available category once per deal.',
  },
  '6-2': {
    prerequisites: ['6-1'],
    introduction:
      'A frequency table answers how often a hand occurs. A ranking rule answers which hand wins. We’ll keep those questions separate as the card count changes.',
    takeaway:
      'Searching seven cards changes category frequencies. Showdown still compares the strongest five using the same ranking rules.',
    mistake:
      'An unusual outcome is not automatically a strong outcome. Rarity cannot promote high card above a pair.',
    question:
      'Why can adding cards make high card less common without making it stronger?',
    answer:
      'The extra cards offer more ways to form pairs, straights, or flushes. Those deals leave the high-card category because a stronger five becomes available. The remaining high-card hands still lose to a pair under the unchanged comparison rule.',
  },
  '6-3': {
    prerequisites: ['3-1', '6-1'],
    introduction:
      'A royal flush fixes five specific cards. We’ll count the ways to complete that fixed set, then ask what a short simulation can actually tell us.',
    takeaway:
      'Build each favorable set exactly once. A royal is already included in the straight-flush category, and an empty sample does not make its probability zero.',
    mistake:
      'Adding royal flushes to a total that already contains straight flushes counts the royals twice.',
    question:
      'Why can a seven-card set containing a royal be assigned to just one royal suit?',
    answer:
      'Different royal suits require disjoint groups of five cards. A seven-card set cannot contain two such groups. Choosing the royal suit and then the remaining cards therefore gives each favorable set one construction.',
  },
  '7-1': {
    prerequisites: ['3-2', '4-1', '5-1'],
    introduction:
      'Once your hole cards are fixed, the flop comes from a smaller deck. We’ll define one target at a time: a matching rank, a draw, or a made hand.',
    takeaway:
      'Count flops after removing your hole cards. “Contains my rank,” “makes a draw,” and “wins at showdown” are different events.',
    mistake:
      'A full-board hit chance includes cards you may have to pay again to see. It does not automatically price a flop call.',
    question:
      'With two hearts in your hand, does a flop containing three hearts belong to the event “exactly a flush draw”?',
    answer:
      'No. It already makes a flush. The exact-draw event in this lesson requires two hearts on the flop and one card of another suit. Define whether your event includes stronger made hands before counting.',
  },
  '7-2': {
    prerequisites: ['4-1', '5-1', '7-1'],
    introduction:
      'A board can be described by ranks and by suits at the same time. We’ll sort those descriptions before using them to reason about an opponent.',
    takeaway:
      'Rainbow, two-tone, and monotone partition flop suit textures. Rank textures are a separate classification, and known cards change the available counts.',
    mistake:
      'An overcard on the board does not establish that an opponent paired it. Public texture and hidden holdings are different information.',
    question: 'Can a flop be both paired and monotone?',
    answer:
      'No. A pair needs two cards of the same rank, while a monotone flop uses one suit. A standard deck has only one card of a given rank in that suit. A paired flop can, however, be two-tone.',
  },
  '8-1': {
    prerequisites: ['4-1', '5-2'],
    introduction:
      'We’ll turn a visible draw into a list of useful cards, then distinguish seeing the next card from seeing both remaining cards.',
    takeaway:
      'An out belongs to a specified improvement event. Count at least one hit by subtracting the chance of missing every remaining draw.',
    mistake:
      'A chance to complete a draw is not necessarily a chance to win. A two-card chance also assumes both cards are actually seen.',
    question:
      'If the turn misses a fixed flush-out list, what changes before calculating the river chance?',
    answer:
      'Remove the known turn card from the remaining deck. Because it was not on the list, the number of favorable hearts stays the same. There is now only one future draw, so use the updated one-card calculation.',
  },
  '8-2': {
    prerequisites: ['4-2', '8-1'],
    introduction:
      'Not every apparent out is distinct, and not every improvement wins. We’ll inspect the physical cards before trusting a large draw count.',
    takeaway:
      'Count shared outs once. Check the opponent’s possible improvements and distinguish a next-card out from a two-card backdoor path.',
    mistake:
      'A card that puts you ahead on the turn can still lose after the river. “Clean now” is not “guaranteed to win.”',
    question:
      'Can a hand with no one-card flush outs still make a flush by the river?',
    answer:
      'Yes. A backdoor flush may require a suitable turn and a suitable river. Neither future card completes the flush alone. Count the two-stage path, with card removal, instead of assuming no immediate outs means no possible final improvement.',
  },
  '9-1': {
    prerequisites: ['3-1', '4-1', '5-1'],
    introduction:
      'The hypergeometric distribution gives a name to a counting method you have already used. We’ll choose the target cards and the non-target cards separately.',
    takeaway:
      'For a fixed-size sample without replacement, choose the required successes and the remaining failures, then divide by all possible samples.',
    mistake:
      'Choosing the desired aces alone does not fill the hand. You must also count ways to choose its non-aces.',
    question:
      'Why does an exactly-two-aces count choose all remaining cards from the non-aces?',
    answer:
      'Because another ace would violate “exactly two.” The success choice and the non-success choice fill separate roles. Each completed hand can be split back into those two groups uniquely, so the multiplication counts it once.',
  },
  '9-2': {
    prerequisites: ['4-2', '9-1'],
    introduction:
      'More opponents create more opportunities for a higher pair. We’ll first count one seat, then identify the deals counted again when another seat also qualifies.',
    takeaway:
      'At-least-one-opponent events overlap. Inclusion–exclusion corrects the overlap while card removal preserves dependence between seats.',
    mistake:
      'Multiplying a single-seat chance by the number of seats counts deals with several qualifying opponents repeatedly.',
    question:
      'If one opponent holds two aces, may the next opponent’s ace-pair count still use all four aces?',
    answer:
      'No. Those two physical aces are unavailable. Count the second hand from the cards remaining after the first hand. This is why joint seat events require more than copying the original single-seat calculation.',
  },
  '10-1': {
    prerequisites: ['2-1', '3-1'],
    introduction:
      'Within one hand, the deck shrinks. Between these model trials, the experiment resets. That change is what makes the binomial model appropriate.',
    takeaway:
      'The binomial distribution counts successes across independent trials with the same success chance. Count the placements of successes as well as the chance of one sequence.',
    mistake:
      'The probability of one particular win/loss sequence is not the probability of every sequence with the same number of wins.',
    question:
      'Why do win–loss–win and win–win–loss both contribute to exactly two wins?',
    answer:
      'The event specifies the count, not the order. These are distinct sequences with the same success count. Under the fixed independent-trial model they have the same path probability, so the binomial coefficient counts how many such paths to include.',
  },
  '10-2': {
    prerequisites: ['4-1', '10-1'],
    introduction:
      'We’ll separate three questions: how long until the first success, whether it happens by a deadline, and how many rare successes occur in a long run.',
    takeaway:
      'A geometric waiting time includes the successful trial. A Poisson approximation describes a count of rare events, not the next outcome becoming due.',
    mistake:
      'An average waiting time is neither a deadline nor a point at which the next independent deal changes its chance.',
    question:
      'After a long series of misses, what has changed about the next freshly restored experiment?',
    answer:
      'Under the fixed independent model, nothing about its success chance has changed. The total wait has grown, but the process still starts the next attempt with the same possibilities. A changing real-world process would need a different model.',
  },
  '11-1': {
    prerequisites: ['0-2', '5-1'],
    introduction:
      'Winning and receiving a share of the pot are not quite the same question. We’ll assign credit to every legal runout before averaging it.',
    takeaway:
      'Equity is average pot share: full credit for a win, no credit for a loss, and the appropriate split for a tie.',
    mistake:
      'Calling a matchup a “coin flip” hides suit, rank, and tie details. Use the actual cards for an actual calculation.',
    question: 'Why can win frequency alone underestimate equity?',
    answer:
      'A tied winner receives part of the pot even though the result is not an outright win. Add the share earned by each tie before dividing by all runouts. The share depends on how many players tie for that pot.',
  },
  '11-2': {
    prerequisites: ['11-1'],
    introduction:
      'We’ll change one feature of a matchup at a time. That makes it possible to see what domination, suitedness, and another opponent actually change.',
    takeaway:
      'Matchup features change the legal winning and tying runouts. Their effect depends on the opposing cards or range.',
    mistake:
      'Adding a universal suitedness bonus to every hand ignores blockers, stronger flushes, and the opponent’s distribution.',
    question: 'Why can pairing the shared ace fail to help AQ against AK?',
    answer:
      'Both players can use the ace pair. If their best fives otherwise tie until the kicker comparison, the king outranks the queen. Improving your own hand’s category does not necessarily improve your position relative to the opponent.',
  },
  '12-1': {
    prerequisites: ['1-2', '10-1'],
    introduction:
      'A probability says how often something happens. Expected value also asks what you gain or lose when it does. We’ll build that average one outcome row at a time.',
    takeaway:
      'Expected value is the sum of each net payoff weighted by its probability. State the units and the point from which gains and losses are measured.',
    mistake:
      'A positive expected value is not a promise of profit on the next trial, nor does it describe the size of possible losses.',
    question:
      'Can an expected payoff be a number that no individual trial can produce?',
    answer:
      'Yes. An average of different payoffs can lie between the possible outcomes. It summarizes repeated outcomes under the model; it is not an extra outcome in the payoff table. Keep the distribution when you need to discuss risk.',
  },
  '12-2': {
    prerequisites: ['11-1', '12-1'],
    introduction:
      'We’ll account for every chip in a call. First name the pot you can win and the new cost, then solve for the equity that makes the call break even.',
    takeaway:
      'Call EV is expected final-pot award minus the new call cost. The pot input includes the opponent’s bet, and the final pot also includes your call.',
    mistake:
      'Using the old pot before the opposing bet, or charging your call twice, changes the decision you are pricing.',
    question:
      'Why is folding assigned zero even if you already put chips into the pot earlier?',
    answer:
      'The comparison begins at the current decision. Earlier chips have already left your stack and cannot be recovered by choosing fold. Calling is evaluated by its additional cost and expected award from the same point. Whole-hand profit uses a different starting point.',
  },
  '13-1': {
    prerequisites: ['5-2', '12-2'],
    introduction:
      'A cheap flop call can lead to an expensive turn decision. We’ll work backward from final outcomes so every later payment appears in the calculation.',
    takeaway:
      'At chance nodes, average branch values. At decision nodes, compare available actions using a stated plan for later choices.',
    mistake:
      'Using river equity while charging only the flop call can leave the cost of reaching the river out of the model.',
    question:
      'Why must you specify what you will do after a missed turn before valuing today’s draw call?',
    answer:
      'That choice determines whether you pay more, abandon the hand, or reach showdown. Each policy creates different final costs and awards. A future card probability alone cannot describe the value of an unspecified future action.',
  },
  '13-2': {
    prerequisites: ['11-1', '13-1'],
    introduction:
      'Raw equity measures a showdown that might never happen. We’ll examine how later decisions change the value you actually capture.',
    takeaway:
      'Equity realization depends on actions, position, and opponents. A capture factor is an assumption to test, not a property printed on the hole cards.',
    mistake:
      'A precise equity estimate does not make an assumed realization factor precise.',
    question:
      'Can two strategies holding the same cards capture different value against the same opponent?',
    answer:
      'Yes. They may fold on different streets, choose different bet sizes, or win different amounts when they improve. The legal showdown runouts can be identical while the actions and cash flows differ. Use a decision tree when those paths can be described explicitly.',
  },
  '14-1': {
    prerequisites: ['12-1'],
    introduction:
      'Knowing the average leaves an important question unanswered: how far can results stray from it? We’ll measure those distances before naming variance.',
    takeaway:
      'Variance averages squared deviations from the mean. Standard deviation takes the square root so the spread has the original payoff units.',
    mistake:
      'Ordinary signed deviations cancel around the mean. Adding them cannot measure the size of fluctuations.',
    question:
      'Why can we not add the standard deviations of independent hands to get the session’s standard deviation?',
    answer:
      'For independent hands it is the variances that add. Standard deviation is obtained by taking the square root of the total variance. Adding the roots first describes a different calculation and overstates the spread when multiple nonzero variances are involved.',
  },
  '14-2': {
    prerequisites: ['11-1', '12-1', '14-1'],
    introduction:
      'An all-in result contains both a decision and a later runout. We’ll replace that runout’s award with its average and see exactly which luck remains.',
    takeaway:
      'All-in adjustment replaces eligible actual awards with their expected awards at commitment. It removes a particular source of card luck, not every source.',
    mistake:
      'An adjusted results line is not a complete measure of skill. It retains earlier cards, chosen situations, and model uncertainty.',
    question:
      'If a short stack is all in, must every side pot already be ready for an EV adjustment?',
    answer:
      'No. Deeper players may still add chips or fold. Different pots can have different eligible players and different moments when their outcomes become fixed except for cards. Each pot needs its own commitment point.',
  },
  '15-1': {
    prerequisites: ['10-1', '14-1'],
    introduction:
      'We’ll distinguish one growing session from many repeated sessions. Both help explain why averages become more stable without requiring wins to repay losses.',
    takeaway:
      'The law of large numbers concerns the average as observations accumulate. It does not change the probability of the next independent outcome.',
    mistake:
      'More trials do not require the absolute gap in total wins to shrink, or the running average to improve at every step.',
    question:
      'What is different about increasing hands per set and increasing the number of sets in the experiment?',
    answer:
      'More hands per set makes each set average less variable under the model. More sets supplies more observations of that distribution of averages. It makes the histogram better sampled without changing the number of hands contributing to each average.',
  },
  '15-2': {
    prerequisites: ['14-1', '15-1'],
    introduction:
      'Individual outcomes can have only two values while their averages have many. We’ll use that distinction to understand what the bell curve describes.',
    takeaway:
      'The central limit theorem concerns the distribution of suitably standardized sums or averages under its conditions. It does not turn individual outcomes into a bell curve.',
    mistake:
      'A smooth-looking histogram does not establish that a normal approximation is accurate in rare tails.',
    question:
      'Does a bell-shaped distribution of session averages mean individual all-ins have bell-shaped payoffs?',
    answer:
      'No. Each individual all-in can still have just two modeled payoffs. A session combines many outcomes and its average can take many values. The theorem describes the appropriately rescaled session averages across repeated sessions.',
  },
  '16-1': {
    prerequisites: ['14-1', '15-2'],
    introduction:
      'An estimate from a sample can miss the true value. We’ll build intervals repeatedly and count how often the procedure captures the known answer.',
    takeaway:
      'A confidence level describes repeated-sample coverage of an interval procedure. Sample count and assumptions belong beside the estimate.',
    mistake:
      'One observed interval is not a promise to contain the truth, and a narrow interval cannot repair unrepresentative data.',
    question:
      'In the coverage experiment, which changes between samples: the supplied truth or the interval?',
    answer:
      'The supplied truth stays fixed. Each newly sampled data set produces a possibly different interval. Coverage counts how often those moving intervals include that fixed truth. This is the repeated-sampling interpretation of the procedure.',
  },
  '16-2': {
    prerequisites: ['10-1', '16-1'],
    introduction:
      'A surprising result prompts a question about a model. We’ll define that model first, then distinguish a test result from a score of your forecasting skill.',
    takeaway:
      'A p-value measures extremeness under a specified null model. Forecast scoring and calibration evaluate different properties across repeated predictions.',
    mistake:
      'The p-value is not the probability that the null is true, or that a downswing was caused by bad play.',
    question:
      'Why does selecting only your worst-looking stretch of hands change the meaning of a test?',
    answer:
      'You used the outcomes to choose what would be tested. Many candidate stretches gave you opportunities to find something dramatic. A test for one window chosen in advance does not account for that search; the selection procedure must also be considered.',
  },
  '17-1': {
    prerequisites: ['11-1', '15-1', '16-1'],
    introduction:
      'When counting every outcome is too expensive, sample outcomes from the same model. We’ll follow one trial from generated cards to its contribution to the average.',
    takeaway:
      'Monte Carlo averages measurements from the intended distribution. More samples reduce sampling error but cannot correct the wrong distribution.',
    mistake:
      'Counting wins when the target is pot share loses tie credit. Choose the measured quantity before running trials.',
    question:
      'What must a simulation record on a multiway tie if its target is equity?',
    answer:
      'The fraction of the relevant pot awarded to the player. A binary win flag is insufficient because a tie has a nonzero share smaller than a full win. Average those shares across legal sampled outcomes.',
  },
  '17-2': {
    prerequisites: ['17-1'],
    introduction:
      'A replayable result is easier to inspect. We’ll separate that useful property from independent evidence and from whether the underlying assumptions are right.',
    takeaway:
      'A seed makes an experiment repeatable. Its error interval describes sampling uncertainty within the supplied model, not uncertainty about every model assumption.',
    mistake:
      'Rerunning identical inputs and seed repeats observations. It does not double the independent sample size.',
    question:
      'Would exact enumeration settle a disagreement about which hands an opponent is likely to hold?',
    answer:
      'No. It would remove sampling error for the range you supplied. Different plausible ranges could still give different exact answers. Investigate the range assumption separately from the numerical accuracy of its calculation.',
  },
  '18-1': {
    prerequisites: ['3-2', '5-1', '11-1'],
    introduction:
      'A range is a weighted list of possible physical hands. We’ll remove impossible entries before calculating what the surviving weights mean.',
    takeaway:
      'Known cards eliminate physical combos. Renormalize the remaining weights, and reject impossible joint hands when several players are modeled.',
    mistake:
      'A hand-class weight is not its final probability. Class size and blockers determine how much legal weight remains.',
    question: 'If As is visible, does the entire AA class disappear?',
    answer:
      'No. Only combos containing As become impossible. Ace pairs using the other aces remain legal. Expand the class into physical pairs, remove the blocked ones, and then recompute the total weight.',
  },
  '18-2': {
    prerequisites: ['18-1'],
    introduction:
      'Two ranges can have similar averages and very different strongest hands. We’ll inspect the distribution instead of relying on one equity number.',
    takeaway:
      'Range advantage concerns an average; nut advantage concerns the strongest holdings. A polarized range and a merged range have different shapes.',
    mistake:
      'A high average does not prove that a range owns more of the strongest hands on a board.',
    question:
      'Why can a range with many medium-strength hands have a strong average without a nut advantage?',
    answer:
      'Those medium hands can contribute consistently to its mean. Another range may include more weak hands but also more of the very strongest combinations. Compare the chosen top-hand group directly instead of inferring it from the mean.',
  },
  '19-1': {
    prerequisites: ['5-2', '18-1'],
    introduction:
      'A bet is evidence, but it can come from more than one kind of hand. We’ll keep only the betting branches of a tree and compare what remains.',
    takeaway:
      'Posterior weights are prior weights multiplied by observation likelihoods, then normalized across every way to observe the evidence.',
    mistake:
      'How often strong hands bet is not the same question as how often a betting hand is strong.',
    question: 'Why must the denominator include bets from weak hands?',
    answer:
      'You are conditioning on observing a bet, not on observing a strong hand. Weak-hand bets are also possible explanations of the observed action. Omitting them would assume the conclusion you were trying to estimate.',
  },
  '19-2': {
    prerequisites: ['10-1', '19-1'],
    introduction:
      'A few observed actions cannot pin down a permanent tendency. We’ll represent uncertainty about the rate and carry it into predictions of future actions.',
    takeaway:
      'A beta prior plus comparable binary observations gives an updated distribution over rates. Predictive counts include uncertainty about that rate.',
    mistake:
      'Prior pseudo-counts are model inputs. Reporting them as observed hands exaggerates the evidence.',
    question:
      'Why does plugging the posterior mean into a binomial model leave something out?',
    answer:
      'It treats the estimated rate as if it were known. The posterior still assigns weight to other rates, which produce different future count distributions. The beta-binomial prediction averages over that uncertainty as well as future trial outcomes.',
  },
  '20-1': {
    prerequisites: ['2-2', '16-2', '17-2'],
    introduction:
      'Random-looking steps can still favor some results. We’ll count the paths through a small shuffle before considering a statistical test.',
    takeaway:
      'A fair shuffle needs uniform choices and a correct mapping from choices to final orders. Replayability alone establishes neither property.',
    mistake:
      'Applying a remainder to a random integer can create unequal bucket sizes when the source range does not divide evenly.',
    question:
      'Why can every swap be random while the final shuffle remains biased?',
    answer:
      'Different final orders can be reachable through different numbers of equally likely swap sequences. Those with more paths receive more probability. Count the paths leading to each order; inspecting a single swap is not enough.',
  },
  '20-2': {
    prerequisites: ['10-1', '10-2', '16-2'],
    introduction:
      'A streak in a chosen stretch and a streak somewhere in a long session are different events. We’ll define the observation window before judging surprise.',
    takeaway:
      'Past outcomes do not change the next independent trial. A search for streaks anywhere must account for multiple, overlapping starting positions.',
    mistake:
      'Picking the most dramatic window after seeing a session makes ordinary calculations for a preselected window misleading.',
    question:
      'Why can’t we simply add the chance of a streak starting at each possible hand?',
    answer:
      'A long streak can contain several shorter streaks with different starting positions. The same session would be counted repeatedly. Tracking unfinished run lengths counts whether the target has appeared without recounting those overlapping histories.',
  },
  '21-1': {
    prerequisites: ['11-1', '14-1'],
    introduction:
      'Running twice splits one pot across two runouts. We’ll first average the shares, then examine how drawing from the same remaining deck affects their spread.',
    takeaway:
      'Expected shares average without an independence requirement. Variance also needs covariance because the two runouts can be dependent.',
    mistake:
      'Two runouts from one deck are not automatically independent. Removing the first river changes the second river’s possibilities.',
    question:
      'If the first river is a losing king in the exposed aces-versus-kings example, what changes for the second river?',
    answer:
      'That physical king is gone, so one fewer losing king remains. The runouts are linked through removal. Their marginal expected shares still agree before either river is dealt, but their joint variation must account for the dependence.',
  },
  '21-2': {
    prerequisites: ['11-1', '12-1'],
    introduction:
      'Insurance adds a separate payment contract to the hand. We’ll specify its trigger and cash flows before comparing the premium with the expected benefit.',
    takeaway:
      'A fair fixed-benefit premium equals the trigger probability times the benefit. A seller’s loading adds expected cost to the buyer.',
    mistake:
      'One minus equity need not be the probability of an outright loss, because ties award partial shares.',
    question:
      'If a contract pays only on an outright loss, should a tied pot trigger payment?',
    answer:
      'No. The trigger is part of the contract’s definition. Count outright losses separately from ties, then apply the promised benefit to those losses. A contract covering some tied outcomes would need a different payoff table.',
  },
  '22-1': {
    prerequisites: ['5-2', '12-2'],
    introduction:
      'A bet can profit because the opponent folds or because your hand wins after a call. We’ll price those branches separately.',
    takeaway:
      'A bluff’s value depends on folds, risk, and its payoff when called. A semi-bluff needs equity against the calling range.',
    mistake:
      'Equity against every possible opponent hand can overstate equity against only the hands that continue.',
    question:
      'If an opponent starts calling with weaker hands, is it enough to change only the fold chance in a semi-bluff model?',
    answer:
      'No. The composition of the calling range has changed, which can change your equity when called as well. Recompute both the branch probabilities and their conditional payoffs before comparing the bet’s value.',
  },
  '22-2': {
    prerequisites: ['12-2', '22-1'],
    introduction:
      'We’ll find a betting mix that gives a bluff-catcher equal value from calling and folding, then examine the same reasoning in a tiny playable game.',
    takeaway:
      'Indifference compares action values against a specified strategy. A legal mixed strategy uses only the player’s own information.',
    mistake:
      'The bluff fraction among bets, the bluff-to-value ratio, and the fold frequency needed for a bluff to break even answer different questions.',
    question:
      'Why is a “best response” that changes its action based on the opponent’s hidden card invalid?',
    answer:
      'The player cannot distinguish those hidden states when acting. A legal policy must use the same action probabilities whenever its own card and the public history are the same. A clairvoyant policy solves a different game.',
  },
  '23-1': {
    prerequisites: ['18-1', '22-1'],
    introduction:
      'A shove compresses the future into a small number of branches. We’ll state the covered risk, the call amount, and the calling range before valuing it.',
    takeaway:
      'Push/fold EV combines the fold payoff with the called payoff. An equilibrium range requires solving both players’ interacting choices.',
    mistake:
      'A chart produced for one position, stack, and calling model does not automatically apply to another situation.',
    question:
      'Why should chips an opponent cannot match be removed from the risk used in a heads-up shove calculation?',
    answer:
      'The unmatched excess is returned rather than contested. Including it as money you could lose exaggerates your risk and misstates the final contestable pot. Define the covered amounts before applying the EV formula.',
  },
  '23-2': {
    prerequisites: ['5-2', '12-1', '23-1'],
    introduction:
      'Tournament chips buy chances at prizes rather than a fixed cash amount per chip. We’ll build the finishing-order model before comparing a gain with an equal chip loss.',
    takeaway:
      'ICM converts stacks into modeled finishing probabilities and expected prizes. Equal chip gains and losses can have unequal prize effects.',
    mistake:
      'A chip-profitable gamble need not be prize-profitable. The payout structure changes the objective.',
    question:
      'Why must all players’ expected prizes add to the total prize pool?',
    answer:
      'Every complete finishing order distributes the same prize pool. Averaging those distributions with probabilities that sum to the whole preserves that total. This checks the arithmetic; it does not prove the finishing-order model is realistic.',
  },
  '24-1': {
    prerequisites: ['5-2', '10-1'],
    introduction:
      'We’ll define exactly when the model stops: at zero or at a target. That stopping rule is part of the question, not a detail added afterward.',
    takeaway:
      'Risk of ruin depends on the failure boundary, target or horizon, stake rule, and outcome model. State all of them.',
    mistake:
      'Ruin before a target and ruin within a fixed number of hands are different events and can have different answers.',
    question:
      'Why can’t an unfinished simulated path simply be labeled “survived”?',
    answer:
      'It may still reach zero before the target if allowed to continue. Labeling it safe changes the event from eventual ruin before the target to something closer to ruin before the computational cutoff. Unfinished paths need explicit handling.',
  },
  '24-2': {
    prerequisites: ['10-2', '12-1', '24-1'],
    introduction:
      'Repeated fractional bets multiply wealth. We’ll use logarithms to turn those products into sums, then connect the growth curve to the risked fraction.',
    takeaway:
      'Kelly maximizes expected log growth under a specified model. Its preferred fraction is sensitive to the supplied edge and payoff assumptions.',
    mistake:
      'Maximizing arithmetic expected wealth is a different objective from maximizing long-run compound growth.',
    question:
      'Why is losing a fraction and then gaining the same fraction not enough to restore the starting balance?',
    answer:
      'The gain applies to the smaller balance left after the loss. Multiply the two wealth factors instead of cancelling the percentages as though both used the original balance. Logarithms provide an additive way to keep track of those compounded factors.',
  },
  '25-1': {
    prerequisites: ['22-2'],
    introduction:
      'This optional capstone turns the small game’s action comparisons into an iterative learning rule. We’ll inspect one regret update before running the trainer.',
    takeaway:
      'Regret matching converts positive accumulated action regrets into a policy. CFR also preserves hidden information and averages strategies across iterations.',
    mistake:
      'The latest strategy can fluctuate. A local update or a good current payoff is not an equilibrium certificate.',
    question:
      'If every action’s cumulative regret is nonpositive, can we normalize the positive regrets directly?',
    answer:
      'No. Their positive parts sum to zero, so division cannot define a policy. This trainer uses a uniform mixture in that case. The cumulative regrets remain stored and can change after later updates.',
  },
  '25-2': {
    prerequisites: ['25-1'],
    introduction:
      'A plausible matchup payoff can conceal exploitable strategies. We’ll hold one player fixed at a time and measure the best legal improvement available to the other.',
    takeaway:
      'Exploitability measures incentives for unilateral improvement in the specified game. It tests more than agreement with one target payoff.',
    mistake:
      'A bound for the tiny AKQ game does not certify a strategy for full Hold’em with different cards and actions.',
    question:
      'Why is matching the equilibrium game value against one opponent insufficient evidence of equilibrium?',
    answer:
      'Two flawed strategies can offset each other’s mistakes and produce the expected average. A different legal opponent may exploit either one. Check each player’s best response while holding the other strategy fixed.',
  },
};

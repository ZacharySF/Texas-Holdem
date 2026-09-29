<script lang="ts">
  import { potOddsExamples } from '../../content/potOddsFacts';
  import { formatPercent } from '../../engine/math';
  const e = potOddsExamples();
</script>

<section
  class="pot-odds-guide"
  aria-label="Understanding pots and expected awards"
>
  <h3>Start with the question: is the next call worth its price?</h3>
  <p>
    Pot odds describe the price of staying in. Equity describes your estimated
    average share of the final pot. They answer different questions. Neither
    tells you that you will win this particular hand.
  </p>
  <h3>1. Count the pot after calling</h3>
  <p>
    Suppose the pot already contains {e.pot} chips, including the opponent’s bet.
    You must call {e.call}. Calling makes the final pot {e.pot} + {e.call} =
    {e.total}. If you win it, you receive {e.total}, but your stack grows by
    only
    {e.winNet}: you first paid {e.call} to get there.
  </p>
  <h3>2. An estimated award is an average return, before costs</h3>
  <p>
    Imagine {e.trials} equally likely outcomes with no more betting: {e.wins}
    outright wins, {e.ties} two-way ties, and {e.losses} losses. These are teaching
    assumptions, not measured odds for your cards. A win returns {e.winAward}, a
    tie returns {e.tieAward}, and a loss returns zero.
  </p>
  <p>
    Total returned: {e.wins} × {e.winAward} + {e.ties} × {e.tieAward} =
    {e.awardSum} chips. Average returned: {e.awardSum} ÷ {e.trials} =
    <strong>{e.award} chips</strong>. That is the expected award. You never
    actually receive exactly that amount in this example; it summarizes the
    different possible returns.
  </p>
  <p>
    Counting a tie as half a pot gives equity of {formatPercent(e.equity)}. So
    equity × final pot gives the same answer:
    {formatPercent(e.equity)} × {e.total} = {e.award} chips. The coach estimates these
    shares by sampling legal hidden hands and boards, using assumed opponent ranges.
    It does not read their actual hidden cards.
  </p>
  <h3>3. Subtract the call once, because you pay it every time</h3>
  <p>
    Expected award − new call = {e.award} − {e.call} =
    <strong>{e.net} chips of expected net gain</strong>. We subtract the call
    from the award; we do not subtract the award from the call. The alternative
    is to average net outcomes: a win gains {e.winNet}, a tie gains {e.tieNet},
    and a loss changes your stack by {e.lossNet}. Both methods agree. Do not
    subtract the cost a second time after using net outcomes.
  </p>
  <p>
    Folding has a value of zero <em>from this decision onward</em>. It does not
    refund earlier bets. Those chips have already left your stack whether you
    call or fold, so charging for them again would double-count the cost.
  </p>
  <h3>4. Break-even is the share that pays back the call</h3>
  <p>
    Set average returned chips equal to the call. The required share is
    {e.call} ÷ {e.total} = {formatPercent(e.threshold)}. Above that share,
    calling earns chips on average under this model; below it, folding costs
    less. This is a comparison with folding, not proof that calling beats every
    raise.
  </p>
  <h3>5. Why count different pots?</h3>
  <p>
    Suppose A is all in for {e.contributions[0]}, while you and B each
    contribute
    {e.contributions[1]} in total. The first {e.contributions[0]} from each of the
    three players forms a {e.layers[0].amount}-chip main pot. All three can win
    it. The extra chips from you and B form a {e.layers[1].amount}-chip side
    pot. Only you and B can win that one. A cannot win chips A never matched.
  </p>
  <p>
    If A has the best hand and you have the next-best hand, A wins the main pot
    and you win the side pot. This is why applying one overall chance of beating
    everyone to all the chips gives the wrong answer. Chips nobody matches are
    returned, rather than becoming a prize for other players.
  </p>
  <p>
    For a worked assumption, give yourself an average share of
    {formatPercent(e.shares[0])} in the main pot and
    {formatPercent(e.shares[1])} in the side pot. The separate expected awards are
    {formatPercent(e.shares[0])} × {e.layers[0].amount} = {e.awards[0]} and
    {formatPercent(e.shares[1])} × {e.layers[1].amount} = {e.awards[1]} chips. Add
    them: {e.awards[0]} + {e.awards[1]} = {e.sideAward}. If the remaining call
    is {e.call}, the net value is {e.sideAward} − {e.call} = {e.sideNet}.
    Subtract that call once from the sum, not once per pot.
  </p>
  <p>
    You need not win both pots together to add their average awards. If you are
    the short stack instead, your award from an ineligible side pot is zero.
    More opponents alone do not create side pots: matched contributions can
    still form one pot. The coach’s layers describe its assumed final
    contributions, which may include calls other players have not made yet.
  </p>
  <h3>6. Check the model before trusting the answer</h3>
  <p>
    The live calculation assumes the current bet is matched up to each live
    player’s stack, then betting stops. No rake is taken. Future raises, folds,
    more payments to see later cards, and incorrect range assumptions can change
    the answer. Small differences can be simulation noise. In a tournament,
    expected chips also differ from prize value and survival: a positive chip
    expectation alone does not settle every tournament decision.
  </p>
  <details>
    <summary
      >Check your understanding: should you subtract the call for each pot?</summary
    >
    <p>
      No. Add the expected awards from every eligible pot, then subtract the new
      call once. You make one payment, even if that payment participates in more
      than one pot. A pot you cannot win contributes zero to the award.
    </p>
  </details>
</section>

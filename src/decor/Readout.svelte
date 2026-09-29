<script lang="ts">
  let {
    equity,
    fraction,
    outs,
    street,
  }: { equity: string; fraction: number; outs?: number; street: string } =
    $props();
</script>

<section class="spec-readout" aria-label="Live hand readout">
  <div class="panel-label">01 / readout</div>
  <dl>
    <div>
      <dt>Equity</dt>
      <dd>{equity}</dd>
    </div>
    {#if outs !== undefined}<div>
        <dt>Category outs</dt>
        <dd class="outs-number">{outs}</dd>
      </div>{/if}
    <div>
      <dt>Street</dt>
      <dd class="street-readout">{street}</dd>
    </div>
  </dl>
  <div class="stripe-value" aria-hidden="true">
    <span style:width={`${Math.max(0, Math.min(1, fraction)) * 100}%`}></span>
  </div>
</section>

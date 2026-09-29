<script lang="ts">
  import Hairlines from './Hairlines.svelte';
  import Chevrons from './Chevrons.svelte';
  import GhostWord from './GhostWord.svelte';
  import Masthead from './Masthead.svelte';
  import RunIn from './RunIn.svelte';
  import MicroBlock from './MicroBlock.svelte';
  import Stripes from './Stripes.svelte';
  import Swoosh from './Swoosh.svelte';
  import MotionPhoto from './MotionPhoto.svelte';
  import ThumbStack from './ThumbStack.svelte';
  import WindowFrame from './WindowFrame.svelte';
  import StatusBar from './StatusBar.svelte';
  import Fetch from './Fetch.svelte';
  import IssueNumber from './IssueNumber.svelte';
  import { assetUrl } from '../visual/config';
  const photo = assetUrl('art/hero.jpg');
</script>

<main class="decor-lab" id="main-content" tabindex="-1">
  <h1>Decor laboratory</h1>
  <p>Development only. Decorative layers never change the application state.</p>
  <div class="decor-lab-grid">
    <section>
      <h2>01 / Hairlines</h2>
      <code>horizontal / vertical: percentage offsets</code>
      <div class="decor-lab-sample"><Hairlines /><MicroBlock /></div>
    </section>
    <section>
      <h2>02 / Chevrons</h2>
      <code>march=true</code><Chevrons />
    </section>
    <section>
      <h2>03 / GhostWord</h2>
      <code>word='signal' blur=true</code><GhostWord word="signal" blur />
    </section>
    <section>
      <h2>04 / Masthead</h2>
      <code>word='noise'</code><Masthead word="noise" />
    </section>
    <section>
      <h2>05 / RunIn</h2>
      <code>items=[category, entries[]]</code><RunIn
        items={[
          {
            category: 'Probability',
            entries: ['One deck', 'Counting', 'Outs'],
          },
          { category: 'Practice', entries: ['Equity', 'Decisions'] },
        ]}
      />
    </section>
    <section>
      <h2>06 / MicroBlock</h2>
      <code>lines=copy.ts</code><MicroBlock />
    </section>
    <section>
      <h2>07 / Stripes</h2>
      <code>2px stripes / 6px pitch · powder tint</code>
      <div class="decor-lab-sample"><Stripes /></div>
    </section>
    <section>
      <h2>08 / Swoosh</h2>
      <code>frost / ultraviolet · drift</code>
      <div class="decor-lab-sample"><Swoosh /></div>
    </section>
    <section>
      <h2>09 / MotionPhoto</h2>
      <code>src='/art/hero.jpg' blur=3 ghost=true</code>
      <div class="decor-lab-photo"><MotionPhoto src={photo} /></div>
    </section>
    <section>
      <h2>10 / ThumbStack</h2>
      <code>srcs=[photo, photo, photo]</code><ThumbStack
        srcs={[photo, photo, photo]}
      />
    </section>
    <section>
      <h2>11 / WindowFrame</h2>
      <code>title='~/contemporary/lab' active=true</code><WindowFrame
        title="~/contemporary/lab"
        active><p>Readable content. Untouched children.</p></WindowFrame
      >
    </section>
    <section>
      <h2>12 / StatusBar</h2>
      <code>path, chips, xp, hands, clock, fps</code>
      <div class="decor-lab-status">
        <StatusBar chips={2000} xp={120} hands={6} />
      </div>
    </section>
    <section>
      <h2>13 / Fetch</h2>
      <code>chips=2000 xp=120 hands=6 lessons=3</code><Fetch
        chips={2000}
        xp={120}
        hands={6}
        lessons={3}
      />
    </section>
    <section>
      <h2>14 / IssueNumber</h2>
      <code>n='01'</code><IssueNumber n="01" />
    </section>
  </div>
</main>

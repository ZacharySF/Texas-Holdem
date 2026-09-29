<script lang="ts">
  import { advancedExample } from '../../content/facts';
  import { Rational } from '../../engine/math';
  import { type ModelSpec } from '../../engine/models';
  import { getLesson } from './context';
  import ModelCheck from './ModelCheck.svelte';

  const { lesson, seed } = getLesson();
  let e = $derived(advancedExample(lesson.id));
  let size = $state.raw(20);
  let choice = $state.raw(0);
  let computed1 = $derived.by(() => {
    let model: ModelSpec = e.model;
    if (model.type === 'means' || model.type === 'coverage')
      model = { ...model, size };
    if (lesson.id === '10-1' && choice)
      model = { type: 'binomial', trials: 20, p: 4, d: 5, hits: 16 };
    if (lesson.id === '10-2' && choice === 1)
      model = { type: 'waiting', p: 1, d: 221, within: 221 };
    if (lesson.id === '10-2' && choice === 2)
      model = { type: 'binomial', trials: 221, p: 1, d: 221, hits: 0 };
    return { model };
  });
  let model = $derived(computed1.model);
  function setSize(
    value: typeof size | ((previous: typeof size) => typeof size),
  ) {
    size = typeof value === 'function' ? value(size) : value;
  }
  function setChoice(
    value: typeof choice | ((previous: typeof choice) => typeof choice),
  ) {
    choice = typeof value === 'function' ? value(choice) : value;
  }
</script>

{#if e.model.type === 'means' || e.model.type === 'coverage'}<label
    >Hands inside each trial<select
      value={size}
      onchange={(event) => setSize(Number(event.currentTarget.value))}
      >{#each [1, 5, 20, 100] as n (n)}<option>{n}</option>{/each}</select
    ></label
  >{/if}{#if lesson.chapter === 10}<label
    >Experiment<select
      value={choice}
      onchange={(event) => setChoice(Number(event.currentTarget.value))}
      ><option value={0}>{e.title}</option><option value={1}
        >{lesson.id === '10-1'
          ? 'Exactly sixteen wins among twenty'
          : 'See aces within 221 fresh hands'}</option
      >{#if lesson.id === '10-2'}<option value={2}
          >Zero aces across 221 hands: compare binomial with Poisson</option
        >{/if}</select
    ></label
  >{/if}
<p>
  {model.type === 'means'
    ? `Average of ${model.size} independent binary observations, supplied chance ${model.p}/${model.d}.`
    : model.type === 'coverage'
      ? `Interval coverage over repeated sets of ${model.size} observations, supplied chance ${model.p}/${model.d}.`
      : choice === 0
        ? e.title
        : lesson.id === '10-1'
          ? `Exactly ${'hits' in model ? model.hits : 0} wins in ${'trials' in model ? model.trials : 0} independent ${'p' in model && 'd' in model ? new Rational(model.p, model.d).toString() : ''} trials`
          : choice === 1
            ? 'At least one pocket aces within 221 independent hands'
            : 'Zero pocket aces across 221 independent hands; compare with the Poisson approximation above.'}
</p>
{#key JSON.stringify(model)}<ModelCheck {model} {seed}></ModelCheck>{/key}

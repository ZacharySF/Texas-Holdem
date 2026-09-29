<!-- Course: void + restrained lime metadata; chapter plots carry the image layer.
 Lesson: L0 void; L1 contour raster INSIDE letters; L2 no texture in reading column;
 L3 image-filled title; L4 margin ruler; L5 existing lesson; L6 actual lesson metadata
 and observed worked-number callout; L7 fixed grain. Accent: frost/ultraviolet. -->
<script lang="ts">
  import TypeDevice from './TypeDevice.svelte';
  import Ruler from './Ruler.svelte';
  import Callout from './Callout.svelte';
  import Sticker from './Sticker.svelte';
  import { chapters, lessons } from '../content/lessons';
  let {
    chapter,
    title,
    lessonId,
  }: { chapter?: number; title?: string; lessonId?: string } = $props();
</script>

{#if title}<div class="spread-lesson-heading decor" aria-hidden="true">
    <div class="lesson-edition decor-micro">
      <span>chapter {chapter} / lesson {lessonId?.replace('-', '.')}</span><span
        >{chapters[chapter ?? 0]}</span
      >
    </div>
    <TypeDevice word={title} treatment="image" seed={lessonId} /><Ruler />
    <div class="lesson-margin-ruler"><Ruler vertical count={10} /></div>
  </div>
  <Callout selector=".notebook .katex-html .mord" label="worked value" />
{:else}<div class="spread-course-heading decor" aria-hidden="true">
    <Sticker text="READ / WORK / VERIFY" tilt={-2} /><span class="decor-micro"
      >{chapters.length} chapters / {lessons.length} lessons<br />start with
      chapter 1</span
    ><Ruler />
  </div>{/if}

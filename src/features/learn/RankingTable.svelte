<script lang="ts">
  import { rankingExamples } from '../../content/facts';
</script>

<div class="lesson-table">
  <table>
    <caption
      >Categories, strongest first. Compare ranks within a category.</caption
    ><thead><tr><th>Category</th><th>Example</th><th>Name</th></tr></thead
    ><tbody
      >{#each rankingExamples().reverse() as row (row.category)}<tr
          ><th>{row.category}</th><td class="card-text">{row.cards}</td><td
            >{row.name}</td
          ></tr
        >{/each}</tbody
    >
  </table>
</div>

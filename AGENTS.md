<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture

- Keep the public landing at / and the existing product shell at /dashboard with local component state only; the landing entry navigates directly without authentication because this milestone is interface-only.
- Print styles must isolate the active print area and remove transformed, clipped, or positioned ancestor layouts; named pages select A4 stocktake without changing thermal receipt sizing.

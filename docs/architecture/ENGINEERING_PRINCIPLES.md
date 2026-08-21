# AskUrSenior 12 Engineering Principles & User Perception Standards

## 🔺 The Performance Pyramid & Product North Star

```
                          User Perception (North Star)
                                      ▲
                         Instant Interactions (<100ms)
                                      ▲
                        Smooth UI (Skeletons & Optimistic UI)
                                      ▲
                       Efficient Frontend (Less JS & Render)
                                      ▲
                      Efficient Network (Less APIs & Payloads)
                                      ▲
                     Efficient Backend (Fast Gateway Endpoints)
                                      ▲
                    Efficient Database (Indexes & Lean Queries)
```

> **North Star:** Every interaction MUST feel faster than the user expects. The user never sees your database; they only see how instantly the product responds.

---

## ⚡ The 5 User Perception Rules

1. **Never Make the User Wait:** Prefer prefetching and cached state over skeletons, and skeletons over spinners.
2. **Instant Click Interactions (<100ms):** Every tab switch, page navigation, or button tap must respond visually under 100 ms.
3. **Zero Unnecessary Loading:** Non-volatile static metadata (Subjects, Branches, Schemes, Campus Maps) MUST be cached on the client and never re-fetched unnecessarily.
4. **Optimistic UI Mutations:** UI updates immediately on user action (marking attendance, saving profile, bookmarking notes). Backend synchronization happens silently in the background with automatic rollback on failure.
5. **Enforced Performance Budgets:**
   - **`/home`:** Blocking APIs ≤ 1 | Payload < 20 KB | LCP < 2.0 s | Interaction < 100 ms
   - **`/plus`:** Blocking APIs ≤ 1 | Payload < 25 KB | LCP < 2.2 s | Interaction < 100 ms
   - **`/profile`:** Blocking APIs ≤ 1 | Payload < 15 KB | LCP < 1.8 s | Interaction < 100 ms

---

## 📜 The 12 Official Engineering Principles

1. **One Feature → One Owner:** Every file belongs to exactly one feature or one infrastructure layer.
2. **Single Source of Truth:** One implementation for every feature. No `V1`, `V2`, or `V3` duplicates.
3. **Shared Only When Truly Shared:** A component must be reused by multiple features before moving out of its feature folder.
4. **Mobile First:** Every component is designed and verified for mobile viewports before desktop.
5. **Performance by Default:** No unnecessary API calls. No duplicate fetching. Code splitting via React `lazy()`.
6. **Incremental Refactoring:** Never rewrite large sections. Refactor one feature at a time and verify build passing (`npm run build`).
7. **Configuration Over Hardcoding:** Use feature configuration files (`config/`) for sections, cards, and navigation instead of embedding raw JSX.
8. **Feature Independence:** Features must not directly depend on each other. Shared logic belongs in `core/` or `components/common/`.
9. **Architecture Before Features:** Before adding a feature, answer: Who owns it? Where does it live? Which service owns its API? Which route owns it?
10. **Git Is History:** Never keep `_old`, `_copy`, `_backup`, or `_v2` files in the repository. Git preserves history; the codebase contains only current active code.
11. **Measure Before Optimizing:** Record baseline API counts, load times, bundle sizes, and query durations before making any optimization. Verify improvements with empirical evidence.
12. **Perception First (Optimistic & Instant):** Prioritize instant user perception. Use prefetching, client caching, structural skeletons, and optimistic mutations to make every click feel instant.

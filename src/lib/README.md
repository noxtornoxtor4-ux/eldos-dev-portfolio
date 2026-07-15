# FSD structure

The application keeps routing inside SvelteKit and product code inside Feature-Sliced Design layers.

- `pages` composes the complete page from widgets.
- `widgets` contains independent page sections.
- `features` contains user actions, such as copying the contact email.
- `entities` contains reusable domain views, such as a project card.
- `shared` contains types, configuration and low-level UI.

Dependencies point downward only: `pages → widgets → features/entities → shared`.

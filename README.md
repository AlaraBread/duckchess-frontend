# duckchess frontend

This is a frontend for duckchess, an experimental chesslike game.

It uses [motion](https://motion.dev/) to provide nice animations for the pieces moving.

I am using a table for the chess board to hopefully provide better screen reader accessibility. It works well with gnome orca, but I still have to test with other screen readers.

To run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

Make sure to run the [backend](https://github.com/AlaraBread/duckchess-server/tree/main) as well.

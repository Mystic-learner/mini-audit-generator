import { readStore } from "../../lib/storage";

export default function handler(req, res) {
  const history = readStore();
  res.status(200).json(history.slice().reverse());
}

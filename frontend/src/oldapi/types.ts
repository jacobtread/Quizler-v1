interface Command {
    id: number;
    name: string;
    data: CommandData
}

type CommandData = any

interface Player {
    id: string;
    name: string;
    score: number;
}

export enum Direction {
  UP = '上',
  DOWN = '下',
  LEFT = '左',
  RIGHT = '右'
}

export enum Facing {
  FRONT = '面向你',
  BACK = '背向你'
}

export enum Hand {
  LEFT = '左手',
  RIGHT = '右手'
}

export interface Position {
  x: number;
  y: number;
}

export interface Animal {
  id: string;
  name: string;
  emoji: string;
  color: string;
}

export interface GridQuestion {
  turtlePos: Position;
  animalPlacements: {
    animal: Animal;
    clue: string;
    targetPos: Position;
  }[];
}

export interface LeftRightQuestion {
  facing: Facing;
  handRaised: Hand;
}

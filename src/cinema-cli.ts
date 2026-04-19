import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

type SeatGrid = boolean[][];

type SeatPosition = {
  row: number;
  seat: number;
};

const ROWS = 8;
const SEATS_PER_ROW = 10;

function createSeatGrid(rows: number, seatsPerRow: number): SeatGrid {
  return Array.from({ length: rows }, () => Array.from({ length: seatsPerRow }, () => false));
}

function isInsideGrid(grid: SeatGrid, position: SeatPosition): boolean {
  return (
    position.row >= 1 &&
    position.row <= grid.length &&
    position.seat >= 1 &&
    position.seat <= grid[0].length
  );
}

function isSeatOccupied(grid: SeatGrid, position: SeatPosition): boolean {
  return grid[position.row - 1][position.seat - 1];
}

function reserveSeat(grid: SeatGrid, position: SeatPosition): boolean {
  if (!isInsideGrid(grid, position)) {
    return false;
  }

  if (isSeatOccupied(grid, position)) {
    return false;
  }

  grid[position.row - 1][position.seat - 1] = true;
  return true;
}

function availableSeatsCount(grid: SeatGrid): number {
  return grid.flat().filter((occupied) => !occupied).length;
}

function findFirstAdjacentAvailablePair(grid: SeatGrid): [SeatPosition, SeatPosition] | null {
  for (let rowIndex = 0; rowIndex < grid.length; rowIndex++) {
    for (let seatIndex = 0; seatIndex < grid[rowIndex].length - 1; seatIndex++) {
      const leftSeatFree = !grid[rowIndex][seatIndex];
      const rightSeatFree = !grid[rowIndex][seatIndex + 1];

      if (leftSeatFree && rightSeatFree) {
        return [
          { row: rowIndex + 1, seat: seatIndex + 1 },
          { row: rowIndex + 1, seat: seatIndex + 2 }
        ];
      }
    }
  }

  return null;
}

function formatSeat(position: SeatPosition): string {
  return `R${position.row}-S${position.seat}`;
}

function seatingMap(grid: SeatGrid): string {
  const header = ["    ", ...Array.from({ length: grid[0].length }, (_, index) => `${index + 1}`.padStart(2, " "))].join(" ");

  const rows = grid.map((row, rowIndex) => {
    const seatCells = row.map((occupied) => (occupied ? " X" : " O")).join(" ");
    return `R${String(rowIndex + 1).padStart(2, "0")}: ${seatCells}`;
  });

  return [header, ...rows].join("\n");
}

function parsePositiveInteger(value: string): number | null {
  const parsed = Number.parseInt(value.trim(), 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

async function askSeatPosition(rl: ReturnType<typeof createInterface>): Promise<SeatPosition | null> {
  const rowInput = await rl.question("Row number (1-8): ");
  const seatInput = await rl.question("Seat number (1-10): ");

  const row = parsePositiveInteger(rowInput);
  const seat = parsePositiveInteger(seatInput);

  if (row === null || seat === null) {
    return null;
  }

  return { row, seat };
}

async function runCinemaCli(): Promise<void> {
  const grid = createSeatGrid(ROWS, SEATS_PER_ROW);

  // Sample occupied seats to make searching/reserving behavior visible immediately.
  reserveSeat(grid, { row: 1, seat: 1 });
  reserveSeat(grid, { row: 1, seat: 2 });
  reserveSeat(grid, { row: 3, seat: 5 });
  reserveSeat(grid, { row: 3, seat: 6 });
  reserveSeat(grid, { row: 5, seat: 10 });

  const rl = createInterface({ input, output });

  console.log("Cinema Seat Reservation CLI");
  console.log(`Room size: ${ROWS} rows x ${SEATS_PER_ROW} seats`);

  let running = true;

  while (running) {
    console.log("\nChoose an option:");
    console.log("1) Show seating map");
    console.log("2) Reserve a seat");
    console.log("3) Check seat availability");
    console.log("4) Find first adjacent available pair");
    console.log("5) Reserve first adjacent available pair");
    console.log("6) Show available seat count");
    console.log("0) Exit");

    const option = (await rl.question("Option: ")).trim();

    switch (option) {
      case "1": {
        console.log("\nLegend: O = available, X = occupied");
        console.log(seatingMap(grid));
        break;
      }

      case "2": {
        const position = await askSeatPosition(rl);
        if (!position) {
          console.log("Invalid input. Please enter positive whole numbers.");
          break;
        }

        if (!isInsideGrid(grid, position)) {
          console.log("Seat is outside room boundaries.");
          break;
        }

        const reserved = reserveSeat(grid, position);
        if (!reserved) {
          console.log(`${formatSeat(position)} is already occupied.`);
          break;
        }

        console.log(`${formatSeat(position)} reserved successfully.`);
        break;
      }

      case "3": {
        const position = await askSeatPosition(rl);
        if (!position) {
          console.log("Invalid input. Please enter positive whole numbers.");
          break;
        }

        if (!isInsideGrid(grid, position)) {
          console.log("Seat is outside room boundaries.");
          break;
        }

        console.log(
          isSeatOccupied(grid, position)
            ? `${formatSeat(position)} is occupied.`
            : `${formatSeat(position)} is available.`
        );
        break;
      }

      case "4": {
        const adjacentPair = findFirstAdjacentAvailablePair(grid);
        if (!adjacentPair) {
          console.log("No adjacent pairs are available.");
          break;
        }

        console.log(
          `First adjacent pair found: ${formatSeat(adjacentPair[0])} and ${formatSeat(adjacentPair[1])}`
        );
        break;
      }

      case "5": {
        const adjacentPair = findFirstAdjacentAvailablePair(grid);
        if (!adjacentPair) {
          console.log("No adjacent pairs are available.");
          break;
        }

        reserveSeat(grid, adjacentPair[0]);
        reserveSeat(grid, adjacentPair[1]);

        console.log(
          `Reserved adjacent seats: ${formatSeat(adjacentPair[0])} and ${formatSeat(adjacentPair[1])}`
        );
        break;
      }

      case "6": {
        console.log(`Available seats: ${availableSeatsCount(grid)}`);
        break;
      }

      case "0": {
        running = false;
        break;
      }

      default: {
        console.log("Unknown option. Please pick one of the listed menu options.");
      }
    }
  }

  rl.close();
  console.log("Goodbye.");
}

runCinemaCli().catch((error: unknown) => {
  console.error("Unexpected error:", error);
  process.exitCode = 1;
});

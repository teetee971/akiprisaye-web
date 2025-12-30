import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import Comparateur from "../Comparateur";

// 🔹 Mock Firebase Firestore
jest.mock("firebase/firestore", () => {
  return {
    collection: jest.fn(),
    query: jest.fn(),
    where: jest.fn(),
    getDocs: jest.fn(async () => ({
      docs: [
        {
          id: "product-1",
          data: () => ({
            name: "Lait 1L",
            ean: "1234567890123",
          }),
        },
        {
          id: "price-1",
          data: () => ({
            amount: 1.25,
            store: "Carrefour",
            source: "Relevé terrain",
            date: {
              toDate: () => new Date("2024-01-01"),
            },
          }),
        },
      ],
    })),
    Timestamp: {
      fromDate: jest.fn(),
    },
  };
});

// 🔹 Mock Firebase config
jest.mock("../../firebase_config", () => ({
  db: {},
}));

describe("Comparateur component", () => {
  test("renders input and search button", () => {
    render(<Comparateur />);

    expect(
      screen.getByPlaceholderText(/entrer ou scanner un ean/i)
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: /rechercher/i })
    ).toBeInTheDocument();
  });

  test("fetches and displays product and prices", async () => {
    render(<Comparateur />);

    const input = screen.getByPlaceholderText(/entrer ou scanner un ean/i);
    fireEvent.change(input, {
      target: { value: "1234567890123" },
    });

    fireEvent.click(screen.getByRole("button", { name: /rechercher/i }));

    await waitFor(() => {
      expect(screen.getByText("Lait 1L")).toBeInTheDocument();
      expect(screen.getByText(/1.25 €/i)).toBeInTheDocument();
      expect(screen.getByText(/Carrefour/i)).toBeInTheDocument();
    });
  });
});

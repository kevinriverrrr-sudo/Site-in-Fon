import { formatDate } from "@/lib/utils";

export function ExampleComponent() {
  const currentDate = formatDate(new Date());

  return (
    <div style={{ 
      padding: "1rem", 
      border: "1px solid #ddd", 
      borderRadius: "8px",
      backgroundColor: "#f9f9f9"
    }}>
      <h2>Пример компонента</h2>
      <p style={{ marginTop: "0.5rem", fontSize: "0.9rem", color: "#555" }}>
        Текущая дата: {currentDate}
      </p>
      <p style={{ marginTop: "0.5rem", fontSize: "0.9rem", color: "#555" }}>
        Этот компонент демонстрирует работу путевых псевдонимов.
      </p>
    </div>
  );
}

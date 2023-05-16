import { CursorComponent } from "@tldraw/core";

// 다른 멤버의 커서를 커스텀
const CustomCursor: CursorComponent<{ name: string }> = ({
  color,
  metadata,
}) => {
  return (
    <div
      style={{
        display: "flex",
        width: "fit-content",
        alignItems: "center",
        gap: 8,
      }}
    >
      <div
        style={{
          width: 12,
          height: 12,
          background: color,
          borderRadius: "100%",
        }}
      />
      <div
        style={{
          background: "white",
          padding: "4px 8px",
          borderRadius: 4,
          whiteSpace: "nowrap",
          color: "#292929",
        }}
      >
        {metadata!.name}
      </div>
    </div>
  );
};

export default CustomCursor;

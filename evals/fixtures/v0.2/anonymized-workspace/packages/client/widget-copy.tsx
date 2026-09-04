export const EMPTY_WIDGET_COPY = "아직 추가된 위젯이 없어요.";
export const SAVE_PLACEMENT_LABEL = "위젯 배치 저장";
export const GRID_CELL_ERROR = "선택한 위젯을 이 칸에 놓을 수 없어요.";
export const OPEN_DRAWER_LABEL = "서랍 열기";

// 위젯을 놓을 수 없는 칸은 건너뛴다.
export const canPlaceWidget = (occupied: boolean) => !occupied;

import { memo } from "react";

interface SubtitleStatesProps {
  loading: boolean;
  error: string | null;
  isEmpty: boolean;
}

export const SubtitleStates = memo(function SubtitleStates({
  loading,
  error,
  isEmpty,
}: SubtitleStatesProps) {
  // Loading状态
  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
        <p className="text-sm ml-3">正在加载字幕...</p>
      </div>
    );
  }

  // Error状态
  if (error) {
    return (
      <div className="p-4 text-center">
        <p className="text-sm text-warning">{error}</p>
        <p className="text-xs mt-1 ">请确保视频有字幕且已加载</p>
      </div>
    );
  }

  // Empty状态
  if (isEmpty) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-center">
          <p className="text-sm">暂无字幕数据</p>
          <p className="text-xs mt-1">请尝试播放有字幕的视频</p>
        </div>
      </div>
    );
  }

  // 如果都不是以上状态，返回null（不渲染任何内容）
  return null;
});

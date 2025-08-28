import { memo, useState } from "react";
import { CardHeader, Divider, Button } from "@heroui/react";
import { Icon } from "@iconify/react";
import { SubtitleItem } from "@src/lib/subtitleTypes";
import { Dropdown, type DropdownItem } from "@src/components/ui";

interface SubtitleHeaderProps {
  subtitleCount: number;
  title?: string;
  subtitles: SubtitleItem[];
}

export const SubtitleHeader = memo(function SubtitleHeader({
  title = "Listen Up",
  subtitles,
}: SubtitleHeaderProps) {
  const [copyStatus, setCopyStatus] = useState(false);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const showCopySuccess = () => {
    setCopyStatus(true);
    setTimeout(() => {
      setCopyStatus(false);
    }, 1500);
  };

  const handleCopyAllSubtitles = async () => {
    try {
      const allSubtitlesText = subtitles
        .map((subtitle) => {
          const startTime = formatTime(subtitle.startTime);
          const endTime = formatTime(subtitle.endTime);
          return `${startTime} - ${endTime}\n${subtitle.text}`;
        })
        .join("\n\n");

      await navigator.clipboard.writeText(allSubtitlesText);
      console.log("已复制所有字幕内容");
      showCopySuccess();
    } catch (error) {
      console.error("复制失败:", error);
    }
  };

  const handleCopyForLLM = async () => {
    try {
      const llmText = subtitles
        .map((subtitle) => {
          const startTime = formatTime(subtitle.startTime);
          const endTime = formatTime(subtitle.endTime);
          return `${startTime} - ${endTime}\n${subtitle.text}`;
        })
        .join("\n");

      await navigator.clipboard.writeText(llmText);
      console.log("已复制给大模型格式");
      showCopySuccess();
    } catch (error) {
      console.error("复制失败:", error);
    }
  };

  const formatTimeToSRT = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    const milliseconds = Math.floor((secs % 1) * 1000);
    const wholeSeconds = Math.floor(secs);

    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${wholeSeconds
      .toString()
      .padStart(2, "0")},${milliseconds.toString().padStart(3, "0")}`;
  };

  const handleDownloadSRT = () => {
    try {
      const srtContent = subtitles
        .map((subtitle, index) => {
          const startTime = formatTimeToSRT(subtitle.startTime);
          const endTime = formatTimeToSRT(subtitle.endTime);
          return `${index + 1}\n${startTime} --> ${endTime}\n${
            subtitle.text
          }\n`;
        })
        .join("\n");

      const blob = new Blob([srtContent], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `subtitles_${new Date().getTime()}.srt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log("SRT文件下载完成");
    } catch (error) {
      console.error("下载SRT文件失败:", error);
    }
  };

  const handleDownloadTXT = () => {
    try {
      const txtContent = subtitles
        .map((subtitle) => {
          const startTime = formatTime(subtitle.startTime);
          const endTime = formatTime(subtitle.endTime);
          return `${startTime} - ${endTime}\n${subtitle.text}`;
        })
        .join("\n\n");

      const blob = new Blob([txtContent], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `subtitles_${new Date().getTime()}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log("TXT文件下载完成");
    } catch (error) {
      console.error("下载TXT文件失败:", error);
    }
  };

  // 配置dropdown菜单项
  const copyDropdownItems: DropdownItem[] = [
    {
      key: "copy-all",
      label: "复制所有字幕",
      icon: "mdi:content-copy",
      onClick: handleCopyAllSubtitles,
    },
    {
      key: "copy-llm",
      label: "复制给大模型",
      icon: "mdi:robot",
      onClick: handleCopyForLLM,
    },
  ];

  const downloadDropdownItems: DropdownItem[] = [
    {
      key: "download-srt",
      label: "下载SRT文件",
      icon: "mdi:file-video-outline",
      onClick: handleDownloadSRT,
    },
    {
      key: "download-txt",
      label: "下载TXT文件",
      icon: "mdi:file-document-outline",
      onClick: handleDownloadTXT,
    },
  ];

  return (
    <>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center w-full">
          <h3 className="text-base font-semibold">{title}</h3>
          <div className="flex items-center gap-2">
            <Dropdown
              items={downloadDropdownItems}
              trigger={
                <Button
                  size="sm"
                  variant="flat"
                  isDisabled={subtitles.length === 0}
                  className="min-w-0"
                >
                  <Icon icon="mdi:download" className="w-4 h-4" />
                  下载
                  <Icon icon="mdi:chevron-down" className="w-4 h-4" />
                </Button>
              }
            />
            <Dropdown
              items={copyDropdownItems}
              trigger={
                <Button
                  size="sm"
                  variant="flat"
                  isDisabled={subtitles.length === 0}
                  className="min-w-0"
                >
                  {copyStatus ? (
                    <>
                      <Icon icon="mdi:check" className="w-4 h-4" />
                      已复制
                    </>
                  ) : (
                    <>
                      复制
                      <Icon icon="mdi:chevron-down" className="w-4 h-4" />
                    </>
                  )}
                </Button>
              }
            />
          </div>
        </div>
      </CardHeader>
      <Divider />
    </>
  );
});

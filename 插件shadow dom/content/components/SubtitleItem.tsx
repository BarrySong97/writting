import { memo, useState, useEffect } from "react";
import { Button } from "@heroui/react";
import { Icon } from "@iconify/react";
import { SubtitleItem } from "@src/lib/subtitleTypes";

interface SubtitleItemProps {
  subtitle: SubtitleItem;
  isActive: boolean;
  onSubtitleClick?: (subtitle: SubtitleItem, index: number) => void;
  index: number;
}

export const SubtitleItemComponent = memo(function SubtitleItem({
  subtitle,
  isActive,
  onSubtitleClick,
  index,
}: SubtitleItemProps) {
  const [copyStatus, setCopyStatus] = useState(false);
  const [explainStatus, setExplainStatus] = useState(false);
  const [wordCopyStatus, setWordCopyStatus] = useState<number | null>(null);
  const [selectionStart, setSelectionStart] = useState<number | null>(null);
  const [selectedRange, setSelectedRange] = useState<{
    start: number;
    end: number;
  } | null>(null);
  const [lastClickedIndex, setLastClickedIndex] = useState<number | null>(null);

  // 监听Shift键释放事件
  useEffect(() => {
    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === "Shift" && selectedRange) {
        setSelectedRange(null);
        setLastClickedIndex(null);
      }
    };

    document.addEventListener("keyup", handleKeyUp);
    return () => {
      document.removeEventListener("keyup", handleKeyUp);
    };
  }, [selectedRange]);

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

  const showExplainSuccess = () => {
    setExplainStatus(true);
    setTimeout(() => {
      setExplainStatus(false);
    }, 1500);
  };

  const handleCopySubtitle = async () => {
    try {
      const timeText = `${formatTime(subtitle.startTime)} - ${formatTime(
        subtitle.endTime
      )}`;
      const copyText = `${timeText}\n${subtitle.text}`;

      await navigator.clipboard.writeText(copyText);
      console.log("已复制字幕:", copyText);
      showCopySuccess();
    } catch (error) {
      console.error("复制失败:", error);
    }
  };

  const handleCopyExplain = async () => {
    try {
      const explainText = `Explain this sentence to me in the context of the whole subtitle: ${subtitle.text}`;

      await navigator.clipboard.writeText(explainText);
      console.log("已复制解释请求:", explainText);
      showExplainSuccess();
    } catch (error) {
      console.error("复制失败:", error);
    }
  };

  const handleWordClick = async (
    wordIndex: number,
    word: string,
    fullText: string,
    isShiftKey: boolean
  ) => {
    console.log("handleWordClick:", {
      wordIndex,
      word,
      isShiftKey,
      lastClickedIndex,
    });
    try {
      if (isShiftKey && lastClickedIndex !== null) {
        // Shift+click: 选择范围
        const start = Math.min(lastClickedIndex, wordIndex);
        const end = Math.max(lastClickedIndex, wordIndex);
        setSelectedRange({ start, end });

        // 获取选中范围的所有单词
        const words = fullText.split(/(\s+|[.,!?;:()"])/);
        const selectedTokens = words.slice(start, end + 1);
        const selectedPhrase = selectedTokens.join("").trim();
        const copyText = `Please explain this phrase in English within the context of the whole subtitle: ${selectedPhrase} (Context: ${fullText})`;
        await navigator.clipboard.writeText(copyText);

        // 显示成功状态 - 不清除选中范围，保持选中状态
        setWordCopyStatus(-1); // 用特殊值表示范围复制成功
        setTimeout(() => {
          setWordCopyStatus(null);
        }, 1500);

        console.log("已复制词组解释请求:", copyText);
      } else {
        // 普通点击: 单个单词
        setSelectedRange(null); // 清除之前的选中范围
        setLastClickedIndex(wordIndex);

        const copyText = `Explain this word to me in English: ${word} (Context: ${fullText})`;
        await navigator.clipboard.writeText(copyText);

        // 显示成功状态
        setWordCopyStatus(wordIndex);
        setTimeout(() => {
          setWordCopyStatus(null);
        }, 1500);

        console.log("已复制单词解释请求:", copyText);
      }
    } catch (error) {
      console.error("复制失败:", error);
    }
  };

  const renderWordsAsButtons = (text: string) => {
    // 分词（保留标点符号和空格）
    const words = text.split(/(\s+|[.,!?;:()"])/);

    return words.map((word, index) => {
      // 跳过纯空格和纯标点符号
      if (/^\s*$/.test(word) || /^[.,!?;:()"]*$/.test(word)) {
        return <span key={index}>{word}</span>;
      }

      // 清理单词（移除前后的标点符号用于复制）
      const cleanWord = word.replace(/^[.,!?;:()"]+|[.,!?;:()"]+$/g, "");

      // 如果清理后为空，直接返回原文本
      if (!cleanWord) {
        return <span key={index}>{word}</span>;
      }

      // 检查是否在选中范围内
      const isInSelectedRange =
        selectedRange &&
        index >= selectedRange.start &&
        index <= selectedRange.end;

      // 检查是否是复制成功的单词/词组
      const isWordCopied =
        wordCopyStatus === index ||
        (selectedRange && wordCopyStatus === -1 && isInSelectedRange);

      return (
        <Button
          key={index}
          size="sm"
          variant="light"
          className={`inline-block px-1 py-0 min-w-0 h-auto text-sm font-normal rounded-sm transition-colors ${
            isWordCopied
              ? "bg-success-50 text-success"
              : isInSelectedRange
              ? "bg-primary-100 text-primary"
              : "hover:bg-success-100 hover:text-success"
          }`}
          onPressStart={(e) => {
            const isShiftKey =
              (e as any)?.shiftKey ||
              (e as any)?.nativeEvent?.shiftKey ||
              false;
            console.log("Shift key detected:", isShiftKey, "Event:", e);
            handleWordClick(index, cleanWord, text, isShiftKey);
          }}
        >
          {word}
        </Button>
      );
    });
  };

  return (
    <div
      className={`
        group p-4 rounded-lg cursor-pointer transition-all duration-200 
        hover:bg-default-100 border
        ${
          isActive
            ? "bg-primary-50 border-primary shadow-sm"
            : "bg-content1 border-transparent hover:border-default-200"
        }
      `}
      onClick={() => onSubtitleClick?.(subtitle, index)}
    >
      <div className="flex items-start justify-between gap-4">
        <span className={`text-xs font-mono shrink-0 select-none`}>
          {formatTime(subtitle.startTime)} - {formatTime(subtitle.endTime)}
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-sm leading-relaxed flex flex-wrap items-center">
            {renderWordsAsButtons(subtitle.text)}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity">
          <Button
            isIconOnly
            size="sm"
            variant="light"
            onPressStart={handleCopyExplain}
          >
            {explainStatus ? (
              <Icon icon="mdi:check" className="w-4 h-4 text-success" />
            ) : (
              <Icon icon="mdi:translate" className="w-4 h-4" />
            )}
          </Button>
          <Button
            isIconOnly
            size="sm"
            variant="light"
            onPressStart={handleCopySubtitle}
          >
            {copyStatus ? (
              <Icon icon="mdi:check" className="w-4 h-4 text-success" />
            ) : (
              <Icon icon="mdi:content-copy" className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
});

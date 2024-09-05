import { useTranslation } from 'react-i18next';
import React, { useState } from 'react';
import {
  AiOutlineLoading3Quarters,
  AiOutlineCheckCircle,
  AiOutlineCloseCircle,
  AiOutlineDown,
  AiOutlineRight,
  AiOutlineUp,
} from 'react-icons/ai';
import { AgentToolState } from '../xstates/agentThink';
import { JSONTree } from 'react-json-tree';

// Theme of JSONTree
// NOTE: need to set the theme as base16 style
const THEME = {
  scheme: 'aws',
  author: 'aws',
  base00: '#f1f3f3', // AWS Paper
  base01: '#007faa',
  base02: '#007faa',
  base03: '#007faa',
  base04: '#007faa',
  base05: '#007faa',
  base06: '#007faa',
  base07: '#007faa',
  base08: '#007faa',
  base09: '#007faa',
  base0A: '#007faa',
  base0B: '#007faa',
  base0C: '#007faa',
  base0D: '#007faa',
  base0E: '#007faa',
  base0F: '#007faa',
};

type ToolCardProps = {
  toolUseId: string;
  name: string;
  status: AgentToolState;
  input: { [key: string]: any }; // eslint-disable-line @typescript-eslint/no-explicit-any
  content?: { text: string };
};

const ToolCard: React.FC<ToolCardProps> = ({
  name,
  status,
  input,
  content,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isInputExpanded, setIsInputExpanded] = useState(false);
  const [isContentExpanded, setIsContentExpanded] = useState(false);
  const { t } = useTranslation();

  // Convert output content text to JSON object if possible.
  let displayContent: any = null;
  if (content?.text) {
    try {
      displayContent = JSON.parse(content.text);
    } catch (e) {
      console.log(`cannot parse: ${e}`);
      displayContent = content;
    }
  }
  console.log(`displayContent: ${JSON.stringify(displayContent)}`);
  console.log(`typeof displayContent: ${typeof displayContent}`);

  const toggleExpand = () => setIsExpanded(!isExpanded);
  const toggleInputExpand = () => setIsInputExpanded(!isInputExpanded);
  const toggleContentExpand = () => setIsContentExpanded(!isContentExpanded);

  return (
    <div className="relative rounded-lg bg-aws-paper p-4 shadow">
      <div className="flex items-center justify-between">
        <div className="flex items-center text-base">
          {status === 'running' && (
            <AiOutlineLoading3Quarters className="mr-2 animate-spin text-lg text-aws-lab" />
          )}
          {status === 'success' && (
            <AiOutlineCheckCircle className="mr-2 text-lg text-aws-lab" />
          )}
          {status === 'error' && (
            <AiOutlineCloseCircle className="mr-2 text-lg text-red" />
          )}
          <h3 className="text-lg font-semibold text-aws-font-color">{name}</h3>
        </div>
        <div className="cursor-pointer" onClick={toggleExpand}>
          {isExpanded ? (
            <AiOutlineUp className="text-lg" />
          ) : (
            <AiOutlineDown className="text-lg" />
          )}
        </div>
      </div>

      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-full' : 'max-h-0'}`}>
        {input && (
          <div>
            <div
              className="mt-2 flex cursor-pointer items-center text-sm text-aws-font-color"
              onClick={toggleInputExpand}>
              <p className="font-bold">{t('agent.progressCard.toolInput')}</p>
              {isInputExpanded ? (
                <AiOutlineDown className="ml-2" />
              ) : (
                <AiOutlineRight className="ml-2" />
              )}
            </div>

            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${isInputExpanded ? 'max-h-96' : 'max-h-0'}`}>
              <div className="ml-4 mt-2 text-sm text-aws-font-color">
                <ul className="list-disc">
                  {Object.entries(input).map(([key, value]) => (
                    <li key={key}>
                      <span className="font-semibold">{key}:</span> {value}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {(status === 'success' || status === 'error') && displayContent && (
          <div>
            <div
              className="mt-2 flex cursor-pointer items-center text-sm text-aws-font-color"
              onClick={toggleContentExpand}>
              <p className="font-bold">{t('agent.progressCard.toolOutput')}</p>
              {isContentExpanded ? (
                <AiOutlineDown className="ml-2" />
              ) : (
                <AiOutlineRight className="ml-2" />
              )}
            </div>

            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${isContentExpanded ? 'max-h-96' : 'max-h-0'}`}>
              {displayContent ? (
                <div className="ml-4 mt-2 text-sm text-aws-font-color">
                  {typeof displayContent === 'object' ? (
                    // Render as JSON tree if the content is an object. Otherwise, render as a string.
                    <JSONTree
                      data={displayContent}
                      theme={THEME}
                      invertTheme={false} // disable dark theme
                      labelRenderer={([key]) => (
                        <strong style={{ color: '#232F3E' }}>{key}</strong> // aws-squid-ink
                      )}
                    />
                  ) : (
                    <p>{String(displayContent)}</p>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ToolCard;

import { TutorialstepModel } from '@/types/aem';

export default function TutorialSteps({ steps }: { steps: TutorialstepModel[] }) {
  const sorted = [...steps].sort((a, b) => a.khStepNumber - b.khStepNumber);

  return (
    <div className="space-y-8">
      {sorted.map((step) => (
        <div key={step._path} className="flex gap-5">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-700 text-white flex items-center justify-center text-sm font-bold">
            {step.khStepNumber}
          </div>
          <div className="flex-1 pt-1">
            <h3 className="font-semibold text-gray-900 mb-3">{step.khHeading}</h3>
            <div
              className="prose prose-sm prose-gray max-w-none mb-4"
              dangerouslySetInnerHTML={{ __html: step.khInstruction?.html ?? '' }}
            />
            {step.khCodeSnippet && (
              <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 text-sm overflow-x-auto">
                <code>{step.khCodeSnippet}</code>
              </pre>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

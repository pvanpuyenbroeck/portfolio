import blockContent from './blockContent';
import blogPost from './blogPost';
import comparisonTable from './blocks/comparisonTable';
import contentSection from './blocks/contentSection';
import faqSection from './blocks/faqSection';
import tldrBlock from './blocks/tldrBlock';
import videoBlock from './blocks/videoBlock';

export const schemaTypes = [
  blockContent,
  tldrBlock,
  contentSection,
  faqSection,
  videoBlock,
  comparisonTable,
  blogPost,
];

export default schemaTypes;

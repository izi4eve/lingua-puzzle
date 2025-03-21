import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import Title from './Title';
import { MdTipsAndUpdates } from "react-icons/md";

const Tips = () => {
    const { t } = useTranslation();

    return (
        <div className="whiteBox rounded-4 p-3 my-3">
            <Title icon={<MdTipsAndUpdates size={28} />} text={t('tips')} />
            {/* <p className='fst-italic'> */}
            <p>
                <Trans i18nKey="tips-text">
                    Don't be afraid to make mistakes. The result depends on how quickly and regularly you repeat it over and over again.
                </Trans>
            </p>
        </div>
    );
}

export default Tips;